"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { PrintSheet } from "@/components/PrintSheet";
import { MotifIcon } from "@/components/MotifIcon";
import { StatusBanner } from "@/components/StatusBanner";
import {
  EXAMPLE_CARDS,
  draftFromPalette,
  themeFromDraft,
  type CardDraft,
} from "@/lib/cardModel";
import { downloadDataUrl, nodeToPng, printNode } from "@/lib/exportCard";
import {
  DEFAULT_PARTS,
  PART_CATEGORIES,
  STARTER_ART,
  artPlanFor,
  fallbackArtFor,
  partsByCategory,
  type ArtPlan,
  type PartsSelection,
} from "@/lib/parts";
import {
  READY_STATUS,
  composeLoading,
  composeSuccess,
  fromApiFailure,
  stylizeLoading,
  stylizeSuccess,
  type StatusMsg,
} from "@/lib/statusCopy";
import { THEME_LIST } from "@/lib/themes";

type Mode = "photo" | "parts";

export function CardStudio() {
  const [mode, setMode] = useState<Mode>("photo");
  const [draft, setDraft] = useState<CardDraft>(() => draftFromPalette("electric"));
  const [parts, setParts] = useState<PartsSelection>(DEFAULT_PARTS);
  const [artUrl, setArtUrl] = useState(STARTER_ART);
  const [artPlan, setArtPlan] = useState<ArtPlan | null>(() =>
    artPlanFor(DEFAULT_PARTS),
  );
  const [exampleRef, setExampleRef] = useState("/examples/dana.webp");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(READY_STATUS);
  const [showPrint, setShowPrint] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const frontRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const theme = useMemo(() => themeFromDraft(draft), [draft]);

  const data: CardData = useMemo(
    () => ({
      theme,
      artUrl,
      artBusy: busy,
      artPlan: mode === "parts" ? artPlan : null,
      customName: draft.name || undefined,
      customHp: draft.hp,
    }),
    [theme, artUrl, artPlan, busy, mode, draft.name, draft.hp],
  );

  function applyPartsSelection(next: PartsSelection) {
    const plan = artPlanFor(next);
    setParts(next);
    setMode("parts");
    setArtUrl(plan.artUrl);
    setArtPlan(plan);
    setStatus({
      kind: "ready",
      en: `Parts applied: ${plan.labels.look} · ${plan.labels.outfit} · ${plan.labels.accessory} · ${plan.labels.backdrop}`,
    });
  }

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function patchDraft(patch: Partial<CardDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function applyExample(ex: (typeof EXAMPLE_CARDS)[number]) {
    const next = draftFromPalette(ex.paletteId);
    if ("typeHint" in ex && ex.typeHint) next.typeLabel = ex.typeHint;
    // Keep name blank so user fills their own — examples are inspiration only
    next.name = draft.name;
    setDraft(next);
    setExampleRef(ex.src);
    setArtUrl(
      THEME_LIST.find((t) => t.id === ex.paletteId)?.starterArt || STARTER_ART,
    );
    setArtPlan(null);
    setStatus({
      kind: "ready",
      en: `Inspired by ${ex.title} chrome/palette. Upload a photo or remix parts for YOUR card.`,
    });
  }

  async function startCamera() {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setMode("photo");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setStatus({
        kind: "error",
        en: "Camera permission blocked — upload a photo instead.",
      });
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
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92),
    );
    if (!blob) return;
    stopCamera();
    await runStylize(blob);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    await runStylize(file);
  }

  async function runStylize(blob: Blob) {
    setMode("photo");
    setBusy(true);
    setStatus(stylizeLoading());

    // Immediate preview on the card while Gemini runs
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const preview = URL.createObjectURL(blob);
    previewUrlRef.current = preview;
    setArtUrl(preview);

    try {
      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      form.append("palette", draft.paletteId);
      form.append("typeLabel", draft.typeLabel);
      form.append("exampleRef", exampleRef);
      const res = await fetch("/api/stylize", { method: "POST", body: form });
      let json: {
        image?: string;
        reason?: string;
        billing?: boolean;
        httpStatus?: number;
        errorKind?: string;
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
        setArtPlan(null);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setStatus(stylizeSuccess(json.model));
      } else {
        // Keep photo preview on the card; show exact Gemini failure (402 vs 429 vs other)
        setStatus(
          fromApiFailure({
            reason,
            billing: json.billing,
            httpStatus: json.httpStatus ?? (res.ok ? undefined : res.status),
            errorKind: json.errorKind,
            context: "stylize",
          }),
        );
      }
    } catch (err) {
      setStatus(
        fromApiFailure({
          reason: err instanceof Error ? err.message : null,
          context: "stylize",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function composeFromParts(explicit = false) {
    setMode("parts");
    setBusy(true);
    if (explicit) setStatus(composeLoading());
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palette: draft.paletteId,
          typeLabel: draft.typeLabel,
          exampleRef,
          parts,
        }),
      });
      let json: {
        image?: string;
        reason?: string;
        billing?: boolean;
        httpStatus?: number;
        errorKind?: string;
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
        setArtPlan(null);
        setStatus(composeSuccess(json.model));
      } else {
        const plan = artPlanFor(parts);
        setArtUrl(plan.artUrl);
        setArtPlan(plan);
        const next = fromApiFailure({
          reason,
          billing: json.billing,
          httpStatus: json.httpStatus ?? (res.ok ? undefined : res.status),
          errorKind: json.errorKind,
          context: "compose",
        });
        const blocking =
          next.kind === "billing" || next.kind === "quota" || next.kind === "error";
        setStatus(!explicit && !blocking ? READY_STATUS : next);
      }
    } catch (err) {
      const plan = artPlanFor(parts);
      setArtUrl(plan.artUrl);
      setArtPlan(plan);
      const next = fromApiFailure({
        reason: err instanceof Error ? err.message : null,
        context: "compose",
      });
      const blocking =
        next.kind === "billing" || next.kind === "quota" || next.kind === "error";
      setStatus(!explicit && !blocking ? READY_STATUS : next);
    } finally {
      setBusy(false);
    }
  }

  async function downloadFront() {
    if (!frontRef.current) return;
    setBusy(true);
    try {
      await document.fonts.ready.catch(() => undefined);
      const node = frontRef.current.querySelector(".card-front") as HTMLElement;
      const url = await nodeToPng(node);
      downloadDataUrl(
        url,
        `${(draft.name || "friend").toLowerCase()}-card-front.png`,
      );
      setStatus({
        kind: "success",
        en: "Front card downloaded.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Download failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function downloadSheet() {
    setShowPrint(true);
    setStatus({
      kind: "loading",
      en: "Creating A4 print sheet (front + back)…",
    });
    await new Promise((r) => setTimeout(r, 100));
    if (!printRef.current) return;
    setBusy(true);
    try {
      await document.fonts.ready.catch(() => undefined);
      const url = await nodeToPng(printRef.current);
      downloadDataUrl(
        url,
        `${(draft.name || "friend").toLowerCase()}-print-sheet.png`,
      );
      setStatus({
        kind: "success",
        en: "Print sheet downloaded.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Download failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setShowPrint(true);
    setStatus({
      kind: "loading",
      en: "Creating A4 print sheet (front + back)…",
    });
    await new Promise((r) => setTimeout(r, 100));
    if (!printRef.current) return;
    setBusy(true);
    try {
      await printNode(printRef.current);
      setStatus({
        kind: "success",
        en: "Print dialog opened.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Print failed. Allow pop-ups and retry.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 md:px-6">
      <header className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,#FFE56A_0%,#FF9AC8_45%,#2F6BFF_100%)] p-6 text-black shadow-lg md:p-8">
        <div className="relative space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-black/70">
            © DANA &amp; FRIENDS 2026
          </p>
          <h1 className="font-display text-4xl font-bold leading-none tracking-tight md:text-6xl">
            Card Studio
          </h1>
          <p className="max-w-2xl text-sm font-medium text-black/80 md:text-base">
            Make <strong>any</strong> custom card: photo → Gemini anime/chibi →
            art frame, or mix parts. Example cards (Dana friends, LOHA snack/night)
            are the <em>quality bar</em> — not a theme picker.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-4">
          <div
            ref={frontRef}
            className="mx-auto w-full max-w-[400px] [animation:card-float_4s_ease-in-out_infinite]"
          >
            <CardFront data={data} />
          </div>

          <div className="mx-auto grid w-full max-w-[400px] grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/50">
                Back
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

        <aside className="space-y-4 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1">
            <ModeButton
              active={mode === "photo"}
              onClick={() => {
                setMode("photo");
                setArtPlan(null);
              }}
            >
              1. Photo → Flash
            </ModeButton>
            <ModeButton
              active={mode === "parts"}
              onClick={() => applyPartsSelection(parts)}
            >
              2. Parts mixer
            </ModeButton>
          </div>

          <label className="block space-y-1 text-sm font-semibold">
            Card name
            <input
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1 text-sm font-semibold">
              HP
              <input
                type="number"
                value={draft.hp}
                onChange={(e) =>
                  patchDraft({ hp: Number(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
              />
            </label>
            <label className="block space-y-1 text-sm font-semibold">
              Type label
              <input
                value={draft.typeLabel}
                onChange={(e) => patchDraft({ typeLabel: e.target.value })}
                placeholder="Snack Type"
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-semibold">
            Caption under art
            <input
              value={draft.caption}
              onChange={(e) => patchDraft({ caption: e.target.value })}
              placeholder="Almost 2 · Cuteness 100%"
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50">
              Chrome palette
            </p>
            <div className="flex flex-wrap gap-2">
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    patchDraft({
                      paletteId: t.id,
                      typeLabel:
                        draft.typeLabel ||
                        `${t.label.split(" ")[0]} Type`,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold ${
                    draft.paletteId === t.id
                      ? "border-black shadow"
                      : "border-black/10 opacity-80"
                  }`}
                  style={{ background: t.accentSoft }}
                >
                  <MotifIcon motif={t.motif} size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "photo" ? (
            <div className="space-y-3">
              <p className="text-sm text-black/70">
                Capture or upload → Gemini Flash stylizes to anime/chibi and
                applies it to the art frame (download/print use that result).
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
                    className="card-art-image aspect-square w-full"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="rounded-xl bg-black px-3 py-2.5 text-sm font-bold text-white"
                  >
                    Open camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={captureFromVideo}
                    disabled={busy}
                    className="rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Capture &amp; stylize
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold disabled:opacity-50"
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
                capture="user"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
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
                          applyPartsSelection({ ...parts, [cat.id]: opt.id })
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                          parts[cat.id] === opt.id
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-black/60">
                Chips update the art frame immediately (baked art + overlays).
                Optional: ask Flash to remix pixels when image quota is available.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void composeFromParts(true)}
                className="w-full rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Remix with Gemini Flash
              </button>
            </div>
          )}

          <StatusBanner status={status} />
          {busy && (
            <p className="animate-pulse text-xs font-bold text-[#2F6BFF]">
              Working…
            </p>
          )}

          <div className="border-t border-black/10 pt-3">
            <button
              type="button"
              onClick={() => setShowExamples((v) => !v)}
              className="text-xs font-bold underline"
            >
              {showExamples ? "Hide" : "Show"} example cards (inspiration only)
            </button>
            {showExamples && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {EXAMPLE_CARDS.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="overflow-hidden rounded-xl border border-black/10 text-left hover:border-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.src}
                      alt={ex.title}
                      className="aspect-[3/4] w-full object-cover"
                    />
                    <span className="block px-1.5 py-1 text-[9px] font-bold leading-tight">
                      {ex.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
            <h2 className="font-display text-2xl font-bold">Print sheet</h2>
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
