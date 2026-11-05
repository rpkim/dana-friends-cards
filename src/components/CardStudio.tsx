"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { PrintSheet } from "@/components/PrintSheet";
import { MotifIcon } from "@/components/MotifIcon";
import { downloadDataUrl, nodeToPng, printNode } from "@/lib/exportCard";
import {
  DEFAULT_PARTS,
  PART_CATEGORIES,
  THEME_ART,
  THEME_DEFAULT_PARTS,
  fallbackArtFor,
  partsByCategory,
  type PartsSelection,
} from "@/lib/parts";
import { THEME_LIST, THEMES, type ThemeId } from "@/lib/themes";

type Mode = "parts" | "photo";

const READY_STATUS =
  "Ready — baked anime art is showing. Remix parts or tap Regenerate with Gemini.";

/** Never surface raw framework/SDK strings like "Not Found" in the UI. */
function friendlyStatus(input: {
  reason?: string | null;
  billing?: boolean;
  httpStatus?: number;
  okImage?: boolean;
  model?: string;
  context: "compose" | "stylize";
}): string {
  if (input.okImage) {
    return input.context === "stylize"
      ? `Photo stylized with ${input.model || "Gemini"}.`
      : `Gemini art ready (${input.model || "image model"}).`;
  }

  const raw = (input.reason || "").trim();
  const lower = raw.toLowerCase();
  const billing =
    input.billing ||
    input.httpStatus === 402 ||
    /402|resource_exhausted|prepayment credits|billing|quota/i.test(raw);

  if (billing) {
    return "Gemini credits are empty (402). Top up at ai.studio/projects — showing baked anime art for now.";
  }

  if (
    input.httpStatus === 404 ||
    lower === "not found" ||
    /\b404\b/.test(lower) ||
    /model .+ not found|not_found/i.test(raw)
  ) {
    return input.context === "stylize"
      ? "Gemini stylize unavailable right now — showing current art. Try again after checking API access."
      : "Live Gemini remix unavailable — showing baked anime art. You can still mix parts and print.";
  }

  if (!raw) {
    return input.context === "stylize"
      ? "Stylize unavailable — switch to Parts or check Gemini credits."
      : READY_STATUS;
  }

  // Soften any other API noise; keep it short and actionable.
  if (raw.length > 160) {
    return `${raw.slice(0, 157)}… — showing baked art.`;
  }
  if (/showing baked|baked anime|credits/i.test(raw)) return raw;
  return `${raw} — showing baked anime art.`;
}

export function CardStudio() {
  const [themeId, setThemeId] = useState<ThemeId>("dana");
  const [mode, setMode] = useState<Mode>("parts");
  const [parts, setParts] = useState<PartsSelection>(DEFAULT_PARTS);
  const [customName, setCustomName] = useState("");
  const [customHp, setCustomHp] = useState<number | "">("");
  const [artUrl, setArtUrl] = useState(THEME_ART.dana);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(READY_STATUS);
  const [showPrint, setShowPrint] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const frontRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const composeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = THEMES[themeId];

  const data: CardData = useMemo(
    () => ({
      theme,
      artUrl,
      customName: customName.trim() || undefined,
      customHp: customHp === "" ? undefined : Number(customHp),
    }),
    [theme, artUrl, customName, customHp],
  );

  useEffect(() => {
    const next = THEME_DEFAULT_PARTS[themeId] ?? DEFAULT_PARTS;
    setParts(next);
    setArtUrl(THEME_ART[themeId] || THEME_ART.dana);
    setMode("parts");
    setStatus(READY_STATUS);
  }, [themeId]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Debounced Gemini compose when parts change
  useEffect(() => {
    if (mode !== "parts") return;
    if (composeTimer.current) clearTimeout(composeTimer.current);
    composeTimer.current = setTimeout(() => {
      void composeFromParts(parts, true);
    }, 450);
    return () => {
      if (composeTimer.current) clearTimeout(composeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, mode]);

  async function composeFromParts(
    nextParts: PartsSelection,
    silentFallback: boolean,
  ) {
    setBusy(true);
    if (!silentFallback) setStatus("Asking Gemini for anime/chibi art…");
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId, parts: nextParts }),
      });
      let json: {
        image?: string;
        fallback?: boolean;
        reason?: string;
        billing?: boolean;
        model?: string;
        message?: string;
        error?: string;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = {};
      }
      const reason = json.reason || json.message || json.error || null;
      if (json.image) {
        setArtUrl(json.image);
        setStatus(
          friendlyStatus({
            okImage: true,
            model: json.model,
            context: "compose",
          }),
        );
      } else {
        setArtUrl(fallbackArtFor(themeId, nextParts));
        const next = friendlyStatus({
          reason,
          billing: json.billing,
          httpStatus: res.status,
          context: "compose",
        });
        // Silent auto-remix: keep Ready unless it's a credit/billing issue.
        const isBilling = /credits are empty|402|top up/i.test(next);
        setStatus(
          silentFallback && !isBilling ? READY_STATUS : next,
        );
      }
    } catch (err) {
      setArtUrl(fallbackArtFor(themeId, nextParts));
      const next = friendlyStatus({
        reason: err instanceof Error ? err.message : null,
        context: "compose",
      });
      const isBilling = /credits are empty|402|top up/i.test(next);
      setStatus(silentFallback && !isBilling ? READY_STATUS : next);
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setStatus("Camera permission blocked — upload a photo instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function captureFromVideo() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 512;
    canvas.height = video.videoHeight || 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92),
    );
    if (!blob) return;
    await runStylize(blob);
    stopCamera();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    await runStylize(file);
  }

  async function runStylize(blob: Blob) {
    setBusy(true);
    setMode("photo");
    setStatus("Gemini stylizing photo → anime/chibi…");
    try {
      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      form.append("theme", themeId);
      const res = await fetch("/api/stylize", { method: "POST", body: form });
      let json: {
        image?: string;
        fallback?: boolean;
        reason?: string;
        billing?: boolean;
        model?: string;
        message?: string;
        error?: string;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = {};
      }
      const reason = json.reason || json.message || json.error || null;
      if (json.image) {
        setArtUrl(json.image);
        setStatus(
          friendlyStatus({
            okImage: true,
            model: json.model,
            context: "stylize",
          }),
        );
      } else {
        setStatus(
          friendlyStatus({
            reason,
            billing: json.billing,
            httpStatus: res.status,
            context: "stylize",
          }),
        );
      }
    } catch (err) {
      setStatus(
        friendlyStatus({
          reason: err instanceof Error ? err.message : null,
          context: "stylize",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadFront() {
    if (!frontRef.current) return;
    setBusy(true);
    try {
      const node = frontRef.current.querySelector(
        ".card-front",
      ) as HTMLElement;
      const url = await nodeToPng(node);
      downloadDataUrl(
        url,
        `${(data.customName || theme.name).toLowerCase()}-card-front.png`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadSheet() {
    setShowPrint(true);
    await new Promise((r) => setTimeout(r, 80));
    if (!printRef.current) return;
    setBusy(true);
    try {
      const url = await nodeToPng(printRef.current);
      downloadDataUrl(
        url,
        `${(data.customName || theme.name).toLowerCase()}-print-sheet.png`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setShowPrint(true);
    await new Promise((r) => setTimeout(r, 80));
    if (!printRef.current) return;
    setBusy(true);
    try {
      await printNode(printRef.current);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-6 md:px-6">
      <header className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,#FFE56A_0%,#FF9AC8_45%,#2F6BFF_100%)] p-6 text-black shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-black/70">
            © DANA &amp; FRIENDS 2026
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-tight md:text-6xl">
            Dana &amp; Friends
            <span className="mt-2 block text-2xl font-extrabold md:text-3xl">
              Card Studio
            </span>
          </h1>
          <p className="max-w-xl text-sm font-medium text-black/80 md:text-base">
            Gemini anime/chibi art in a TCG-style frame — mix parts or stylize a
            photo, then download or print front + back with crop marks.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {THEME_LIST.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${
                  themeId === t.id
                    ? "scale-[1.02] border-black shadow-md"
                    : "border-black/10 opacity-80 hover:opacity-100"
                }`}
                style={{ background: t.accentSoft }}
              >
                <MotifIcon motif={t.motif} size={14} />
                {t.name}
              </button>
            ))}
          </div>

          <div
            ref={frontRef}
            className="mx-auto w-full max-w-[400px] transition duration-500 [animation:card-float_4s_ease-in-out_infinite]"
          >
            <CardFront data={data} />
          </div>

          <div className="mx-auto grid w-full max-w-[400px] grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/50">
                Back preview
              </p>
              <CardBack theme={theme} />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={downloadFront}
                className="rounded-xl bg-black px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Download front
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={downloadSheet}
                className="rounded-xl border-2 border-black bg-white px-3 py-3 text-sm font-bold disabled:opacity-50"
              >
                Download print sheet
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handlePrint}
                className="rounded-xl border-2 border-black/20 bg-[#FFF4A8] px-3 py-3 text-sm font-bold disabled:opacity-50"
              >
                Print front + back
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1">
            <ModeButton
              active={mode === "parts"}
              onClick={() => {
                setMode("parts");
                setArtUrl(fallbackArtFor(themeId, parts));
              }}
            >
              Parts mixer
            </ModeButton>
            <ModeButton active={mode === "photo"} onClick={() => setMode("photo")}>
              Photo / camera
            </ModeButton>
          </div>

          <label className="block space-y-1 text-sm font-semibold">
            Card name
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={theme.name}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
            />
          </label>
          <label className="block space-y-1 text-sm font-semibold">
            HP
            <input
              type="number"
              value={customHp}
              onChange={(e) =>
                setCustomHp(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={String(theme.hp)}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
            />
          </label>

          {mode === "parts" ? (
            <div className="space-y-4">
              <p className="text-xs text-black/60">
                Remixes call Gemini (Argon directs style; image model paints the
                frame). Baked anime art shows instantly if credits are empty.
              </p>
              {PART_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-black/50">
                    {cat.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {partsByCategory(cat.id).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setParts((p) => ({ ...p, [cat.id]: opt.id }))
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                          parts[cat.id] === opt.id
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white hover:border-black/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => void composeFromParts(parts, false)}
                className="w-full rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Regenerate with Gemini
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-black/70">
                Capture or upload — Gemini stylizes into anime/chibi card art
                matching the theme reference.
              </p>
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/90">
                {cameraOn ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artUrl}
                    alt="Art preview"
                    className="aspect-square w-full object-cover object-top"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="rounded-xl bg-black px-3 py-2 text-sm font-bold text-white"
                  >
                    Open camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={captureFromVideo}
                    disabled={busy}
                    className="rounded-xl bg-[#2F6BFF] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Capture &amp; stylize
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="rounded-xl border-2 border-black px-3 py-2 text-sm font-bold disabled:opacity-50"
                >
                  Upload photo
                </button>
              </div>
              {cameraOn && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full rounded-xl border border-black/20 px-3 py-2 text-xs font-bold"
                >
                  Close camera
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>
          )}

          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              /credits are empty|402|top up/i.test(status || "")
                ? "bg-amber-100 text-amber-950"
                : /ready —|gemini art ready|photo stylized/i.test(status || "")
                  ? "bg-emerald-50 text-emerald-950"
                  : "bg-black/5 text-black/70"
            }`}
          >
            {status || READY_STATUS}
          </p>
          {busy && (
            <p className="animate-pulse text-xs font-bold text-[#2F6BFF]">
              Working…
            </p>
          )}
        </aside>
      </div>

      <div
        ref={printRef}
        className={
          showPrint
            ? "block"
            : "pointer-events-none absolute -left-[9999px] top-0 w-[1100px]"
        }
        aria-hidden={!showPrint}
      >
        <PrintSheet data={data} />
      </div>

      {showPrint && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black">
              Print sheet
            </h2>
            <button
              type="button"
              className="text-sm font-bold underline"
              onClick={() => setShowPrint(false)}
            >
              Hide
            </button>
          </div>
          <PrintSheet data={data} />
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
        active ? "bg-black text-white shadow" : "text-black/70 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
