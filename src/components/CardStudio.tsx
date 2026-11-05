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
import {
  CAPTION_AI_LABEL,
  CAPTION_AI_VALUE,
  CAPTION_PRESETS,
  DEFAULT_CAPTION,
  isCaptionPreset,
} from "@/lib/captions";
import {
  downloadDataUrl,
  nodeToPng,
  printDataUrl,
  printNode,
} from "@/lib/exportCard";
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
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_MODEL_OPTIONS,
  IMAGE_MODEL_STORAGE_KEY,
  isAllowedImageModel,
} from "@/lib/imageModels";
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

function readStoredImageModel(): string {
  if (typeof window === "undefined") return DEFAULT_IMAGE_MODEL_ID;
  try {
    const raw = window.localStorage.getItem(IMAGE_MODEL_STORAGE_KEY);
    if (isAllowedImageModel(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_IMAGE_MODEL_ID;
}

export function CardStudio() {
  const [mode, setMode] = useState<Mode>("photo");
  const [draft, setDraft] = useState<CardDraft>(() => draftFromPalette("electric"));
  const [parts, setParts] = useState<PartsSelection>(DEFAULT_PARTS);
  const [artUrl, setArtUrl] = useState(STARTER_ART);
  const [artPlan, setArtPlan] = useState<ArtPlan | null>(() =>
    artPlanFor(DEFAULT_PARTS),
  );
  const [exampleRef, setExampleRef] = useState("/examples/dana.webp");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL_ID);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(READY_STATUS);
  const [showPrint, setShowPrint] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  /** Gemini A4 sheet (front+back). Never cropped into the art frame. */
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  /** Select value: a preset label, or CAPTION_AI_VALUE while AI is chosen. */
  const [captionSelect, setCaptionSelect] = useState<string>(DEFAULT_CAPTION);

  useEffect(() => {
    setImageModel(readStoredImageModel());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, imageModel);
    } catch {
      /* ignore */
    }
  }, [imageModel]);

  const frontRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Gallery / Files only — never set `capture` (iOS would force camera). */
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  /** Last uploaded / captured photo — required for AI caption. */
  const photoBlobRef = useRef<Blob | null>(null);

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

  function applyPartsSelection(
    patch: Partial<PartsSelection> | ((prev: PartsSelection) => PartsSelection),
  ) {
    setParts((prev) => {
      const next =
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      // Defer chrome sync so rapid chip clicks compose via functional updates
      // instead of clobbering each other with a stale `parts` closure.
      queueMicrotask(() => {
        const plan = artPlanFor(next);
        setMode("parts");
        setArtUrl(plan.artUrl);
        setArtPlan(plan);
        setStatus({
          kind: "ready",
          en: `Parts applied: ${plan.labels.look} · ${plan.labels.outfit} · ${plan.labels.accessory1}${plan.labels.accessory2 !== "None" ? ` + ${plan.labels.accessory2}` : ""} · ${plan.labels.backdrop}`,
          ko: `파츠 적용: ${plan.labels.look} · ${plan.labels.outfit} · ${plan.labels.accessory1}${plan.labels.accessory2 !== "None" ? ` + ${plan.labels.accessory2}` : ""} · ${plan.labels.backdrop}`,
        });
      });
      return next;
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
      ko: `${ex.title} 스타일을 참고합니다. 사진을 올리거나 파츠로 나만의 카드를 만드세요.`,
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
        ko: "카메라 권한이 거부되었습니다. 사진을 업로드하세요.",
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
    photoBlobRef.current = blob;

    // Photo preview only on the card art frame — sheet result is separate.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const preview = URL.createObjectURL(blob);
    previewUrlRef.current = preview;
    setArtUrl(preview);
    setArtPlan(null);

    try {
      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      form.append("palette", draft.paletteId);
      form.append("typeLabel", draft.typeLabel);
      form.append("exampleRef", exampleRef);
      form.append("imageModel", imageModel);
      form.append("name", draft.name);
      form.append("hp", String(draft.hp));
      form.append("attack1Name", draft.attack1Name);
      form.append("attack1Damage", String(draft.attack1Damage));
      form.append("attack1Text", draft.attack1Text);
      form.append("attack2Name", draft.attack2Name);
      form.append("attack2Damage", String(draft.attack2Damage));
      form.append("attack2Text", draft.attack2Text);
      const res = await fetch("/api/stylize", { method: "POST", body: form });
      let json: {
        image?: string;
        kind?: string;
        reason?: string;
        billing?: boolean;
        httpStatus?: number;
        errorKind?: string;
        model?: string;
        message?: string;
        error?: string;
        prompt?: string;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = {};
      }
      const reason = json.reason || json.message || json.error || null;
      if (json.image) {
        // Full A4 sheet — show/download as print sheet, never crop into art box.
        setSheetUrl(json.image);
        setShowPrint(true);
        if (json.prompt) {
          console.info("[stylize] prompt:\n" + json.prompt);
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

  async function onCaptionSelect(value: string) {
    if (value === CAPTION_AI_VALUE) {
      setCaptionSelect(CAPTION_AI_VALUE);
      if (!photoBlobRef.current) {
        setStatus({
          kind: "error",
          en: "Upload a photo first — AI caption needs the real kid photo.",
          ko: "먼저 사진을 올려 주세요. AI 캡션은 실제 사진이 필요해요.",
        });
        return;
      }
      setBusy(true);
      setStatus({
        kind: "loading",
        en: "Writing a caption from your photo…",
        ko: "사진을 보고 캡션을 쓰는 중…",
      });
      try {
        const form = new FormData();
        form.append("image", photoBlobRef.current, "caption.jpg");
        const res = await fetch("/api/caption", { method: "POST", body: form });
        let json: {
          caption?: string;
          reason?: string;
          error?: string;
          message?: string;
          billing?: boolean;
          httpStatus?: number;
          errorKind?: string;
          model?: string;
        } = {};
        try {
          json = (await res.json()) as typeof json;
        } catch {
          json = {};
        }
        if (json.caption) {
          patchDraft({ caption: json.caption });
          setStatus({
            kind: "ready",
            en: `AI caption: “${json.caption}”${json.model ? ` · ${json.model}` : ""}`,
            ko: `AI 캡션: “${json.caption}”`,
          });
        } else {
          setStatus(
            fromApiFailure({
              reason: json.reason || json.error || json.message || null,
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
      return;
    }

    if (isCaptionPreset(value)) {
      setCaptionSelect(value);
      patchDraft({ caption: value });
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
          imageModel,
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
        ko: "카드 앞면을 다운로드했습니다.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Download failed.",
        ko: "다운로드에 실패했습니다.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function downloadSheet() {
    setShowPrint(true);
    setBusy(true);
    try {
      if (sheetUrl) {
        downloadDataUrl(
          sheetUrl,
          `${(draft.name || "friend").toLowerCase()}-print-sheet.png`,
        );
        setStatus({
          kind: "success",
          en: "Gemini A4 print sheet downloaded.",
          ko: "Gemini A4 인쇄 시트를 다운로드했습니다.",
        });
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
      if (!printRef.current) return;
      await document.fonts.ready.catch(() => undefined);
      const url = await nodeToPng(printRef.current);
      downloadDataUrl(
        url,
        `${(draft.name || "friend").toLowerCase()}-print-sheet.png`,
      );
      setStatus({
        kind: "success",
        en: "Print sheet downloaded.",
        ko: "인쇄 시트를 다운로드했습니다.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Download failed.",
        ko: "다운로드에 실패했습니다.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setShowPrint(true);
    setBusy(true);
    try {
      if (sheetUrl) {
        await printDataUrl(sheetUrl);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
      if (!printRef.current) return;
      await printNode(printRef.current);
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Print failed.",
        ko: "인쇄에 실패했습니다. 팝업을 허용해 주세요.",
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
              onClick={() => applyPartsSelection((prev) => prev)}
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
            <select
              value={
                captionSelect === CAPTION_AI_VALUE
                  ? CAPTION_AI_VALUE
                  : isCaptionPreset(draft.caption)
                    ? draft.caption
                    : captionSelect
              }
              onChange={(e) => void onCaptionSelect(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2 disabled:opacity-60"
            >
              <option value={CAPTION_AI_VALUE}>{CAPTION_AI_LABEL}</option>
              {CAPTION_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
            {!isCaptionPreset(draft.caption) &&
            captionSelect === CAPTION_AI_VALUE ? (
              <span className="block text-xs font-medium text-black/55">
                On card: {draft.caption}
              </span>
            ) : null}
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

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50">
              Image model
            </p>
            <div className="grid gap-1.5">
              {IMAGE_MODEL_OPTIONS.map((opt) => {
                const active = imageModel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setImageModel(opt.id)}
                    className={`rounded-xl border-2 px-3 py-2 text-left transition ${
                      active
                        ? "border-black bg-black text-white shadow"
                        : "border-black/10 bg-white hover:border-black/30"
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span
                      className={`mt-0.5 block font-mono text-[10px] ${
                        active ? "text-white/75" : "text-black/55"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] ${
                        active ? "text-white/70" : "text-black/45"
                      }`}
                    >
                      {opt.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-black/55">
              Used for Photo → Gemini and parts remix. Failures show the real
              API error for the selected model (no silent substitute).
            </p>
          </div>

          {mode === "photo" ? (
            <div className="space-y-3">
              <p className="text-sm text-black/70">
                Capture or upload → Gemini generates a full A4 print sheet
                (front left + back right). The sheet is shown/downloaded as-is —
                not cropped into the art frame.
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
                  onClick={() => {
                    // Separate gallery input with NO capture attribute so
                    // iOS Safari / Android Chrome open the photo library.
                    if (galleryInputRef.current) {
                      galleryInputRef.current.value = "";
                      galleryInputRef.current.click();
                    }
                  }}
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
              {/* Gallery / files only — do NOT add capture here */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
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
                          applyPartsSelection({ [cat.id]: opt.id })
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
                Look / Outfit / Accessory 1 + 2 / Backdrop update the art frame
                immediately (two accessory overlays stack independently).
                Optional: ask Flash to remix pixels when image quota is available.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void composeFromParts(true)}
                className="w-full rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Remix with selected image model
              </button>
            </div>
          )}

          <StatusBanner status={status} />
          {busy && (
            <p className="animate-pulse text-xs font-bold text-[#2F6BFF]">
              Working… / 작업 중…
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
            <h2 className="font-display text-2xl font-bold">
              {sheetUrl ? "Gemini A4 print sheet" : "Print sheet"}
            </h2>
            <button
              type="button"
              className="text-sm font-bold underline"
              onClick={() => setShowPrint(false)}
            >
              Hide
            </button>
          </div>
          {sheetUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sheetUrl}
              alt="Gemini A4 print sheet — front and back"
              className="w-full rounded-2xl border border-black/10 bg-white shadow"
            />
          ) : (
            <PrintSheet data={data} />
          )}
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
