"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { PrintSheet, type PrintPairKind } from "@/components/PrintSheet";
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
  type CaptionPreset,
} from "@/lib/captions";
import {
  downloadDataUrl,
  downloadPdfFromPngs,
  nodeToPng,
  printDataUrl,
  printDataUrls,
  stitchPngsSideBySide,
} from "@/lib/exportCard";
import { ATTACK_OPTIONS } from "@/lib/attacks";
import { STARTER_ART } from "@/lib/parts";
import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_MODEL_OPTIONS,
  IMAGE_MODEL_STORAGE_KEY,
  isAllowedImageModel,
} from "@/lib/imageModels";
import {
  READY_STATUS,
  fromApiFailure,
  stylizeLoading,
  stylizeSuccess,
  type StatusMsg,
} from "@/lib/statusCopy";
import { THEME_LIST, type PaletteId } from "@/lib/themes";

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

/** HP roll: 30–180 in steps of 10 (no min/max on the HP field). */
function randomHp(): number {
  const steps = Math.floor((180 - 30) / 10) + 1;
  return 30 + Math.floor(Math.random() * steps) * 10;
}

function randomCaption(): CaptionPreset {
  return CAPTION_PRESETS[Math.floor(Math.random() * CAPTION_PRESETS.length)]!;
}

function randomPaletteId(): PaletteId {
  return THEME_LIST[Math.floor(Math.random() * THEME_LIST.length)]!.id;
}

export type RandomTrio = {
  hp: number;
  caption: CaptionPreset;
  paletteId: PaletteId;
};

export function rollRandomTrio(): RandomTrio {
  return {
    hp: randomHp(),
    caption: randomCaption(),
    paletteId: randomPaletteId(),
  };
}

export function CardStudio() {
  const [draft, setDraft] = useState<CardDraft>(() => draftFromPalette("electric"));
  const [artUrl, setArtUrl] = useState(STARTER_ART);
  const [exampleRef, setExampleRef] = useState("/examples/dana.webp");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL_ID);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(READY_STATUS);
  const [showPrint, setShowPrint] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  /** Gemini A4 sheet (front + Dana & Friends back). Never cropped into art frame. */
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  /** Personalized friends-party scene for the {name} & Friends back only. */
  const [friendsSceneUrl, setFriendsSceneUrl] = useState<string | null>(null);
  /** Stylized portrait for the live front art frame. */
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<"dana" | "name">("dana");
  const [printPair, setPrintPair] = useState<PrintPairKind>("dana");
  const [printView, setPrintView] = useState<"both" | "switch">("both");
  const [captionSelect, setCaptionSelect] = useState<string>(DEFAULT_CAPTION);
  /** Random HP + caption preset + chrome palette on generate / when toggled on. */
  const [randomTrio, setRandomTrio] = useState(false);

  useEffect(() => {
    setImageModel(readStoredImageModel());
  }, []);

  // Demo / QA: ?face=...&scene=...&name=Jay&palette=aura&random=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const face = q.get("face");
    const scene = q.get("scene");
    const name = q.get("name");
    const palette = q.get("palette");
    const wantRandom = q.get("random") === "1";
    const draftPatch: Partial<CardDraft> = {};
    if (name) draftPatch.name = name;
    if (
      palette === "electric" ||
      palette === "autumn" ||
      palette === "aura" ||
      palette === "sparkle"
    ) {
      draftPatch.paletteId = palette;
    }
    if (Object.keys(draftPatch).length) {
      setDraft((d) => ({ ...d, ...draftPatch }));
    }
    if (face) {
      setPortraitUrl(face);
      setArtUrl(face);
      setShowPrint(true);
    }
    if (scene) {
      setFriendsSceneUrl(scene);
      setShowPrint(true);
    }
    if (wantRandom) {
      const roll = rollRandomTrio();
      applyRandomTrio(roll);
      setRandomTrio(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, imageModel);
    } catch {
      /* ignore */
    }
  }, [imageModel]);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const photoBlobRef = useRef<Blob | null>(null);

  const theme = useMemo(() => themeFromDraft(draft), [draft]);

  const data: CardData = useMemo(
    () => ({
      theme,
      artUrl,
      artBusy: busy,
      customName: draft.name || undefined,
      customHp: draft.hp,
    }),
    [theme, artUrl, busy, draft.name, draft.hp],
  );

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function patchDraft(patch: Partial<CardDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function applyRandomTrio(roll: RandomTrio) {
    const t = THEME_LIST.find((x) => x.id === roll.paletteId);
    setCaptionSelect(roll.caption);
    setDraft((d) => ({
      ...d,
      hp: roll.hp,
      caption: roll.caption,
      paletteId: roll.paletteId,
      typeLabel: d.typeLabel || `${(t?.label || "Friend").split(" ")[0]} Type`,
    }));
  }

  function onToggleRandomTrio(on: boolean) {
    setRandomTrio(on);
    if (on) applyRandomTrio(rollRandomTrio());
  }

  function applyExample(ex: (typeof EXAMPLE_CARDS)[number]) {
    const next = draftFromPalette(ex.paletteId);
    if ("typeHint" in ex && ex.typeHint) next.typeLabel = ex.typeHint;
    next.name = draft.name;
    setDraft(next);
    setCaptionSelect(
      isCaptionPreset(next.caption) ? next.caption : DEFAULT_CAPTION,
    );
    setExampleRef(ex.src);
    setArtUrl(
      THEME_LIST.find((t) => t.id === ex.paletteId)?.starterArt || STARTER_ART,
    );
    setStatus({
      kind: "ready",
      en: `Inspired by ${ex.title} chrome/palette. Upload a photo for YOUR card.`,
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
    setBusy(true);
    setStatus(stylizeLoading());
    photoBlobRef.current = blob;

    // Roll trio before generate when checkbox is on (use local values — state is async).
    let paletteId = draft.paletteId;
    let hp = draft.hp;
    let caption = draft.caption;
    let typeLabel = draft.typeLabel;
    if (randomTrio) {
      const roll = rollRandomTrio();
      applyRandomTrio(roll);
      paletteId = roll.paletteId;
      hp = roll.hp;
      caption = roll.caption;
      const t = THEME_LIST.find((x) => x.id === roll.paletteId);
      typeLabel =
        draft.typeLabel || `${(t?.label || "Friend").split(" ")[0]} Type`;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const preview = URL.createObjectURL(blob);
    previewUrlRef.current = preview;
    setArtUrl(preview);

    try {
      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      form.append("palette", paletteId);
      form.append("typeLabel", typeLabel);
      form.append("exampleRef", exampleRef);
      form.append("imageModel", imageModel);
      form.append("name", draft.name);
      form.append("hp", String(hp));
      form.append("caption", caption);
      form.append("attack1Name", draft.attack1Name);
      form.append("attack1Damage", String(draft.attack1Damage));
      form.append("attack1Text", draft.attack1Text);
      form.append("attack2Name", draft.attack2Name);
      form.append("attack2Damage", String(draft.attack2Damage));
      form.append("attack2Text", draft.attack2Text);
      form.append("weakness", draft.weakness);
      form.append("resistance", draft.resistance);
      form.append("retreat", String(draft.retreat));
      const res = await fetch("/api/stylize", { method: "POST", body: form });
      let json: {
        image?: string;
        kind?: string;
        friendsScene?: string;
        nameBack?: string;
        portrait?: string;
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
      if (json.portrait) {
        setPortraitUrl(json.portrait);
        setArtUrl(json.portrait);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      }
      const scene = json.friendsScene || json.nameBack;
      if (scene) setFriendsSceneUrl(scene);
      if (json.image) {
        setSheetUrl(json.image);
        setShowPrint(true);
        if (json.prompt) {
          console.info("[stylize] prompt:\n" + json.prompt);
        }
        setStatus(stylizeSuccess(json.model));
      } else if (json.portrait || scene) {
        setShowPrint(true);
        setStatus({
          kind: "success",
          en: "Partial Gemini result — portrait and/or friends scene ready; A4 sheet failed.",
        });
      } else {
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
        });
        return;
      }
      setBusy(true);
      setStatus({
        kind: "loading",
        en: "Writing a caption from your photo…",
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

  function fileBase() {
    return (draft.name || "friend").toLowerCase().replace(/[^\w.-]+/g, "-");
  }

  async function captureFrontPng() {
    if (!frontRef.current) throw new Error("Front card not ready.");
    return nodeToPng(frontRef.current);
  }

  async function captureBackPng() {
    if (!backRef.current) throw new Error("Back card not ready.");
    return nodeToPng(backRef.current);
  }

  async function capturePairPngs(): Promise<string[]> {
    if (sheetUrl) return [sheetUrl];
    const [front, back] = await Promise.all([
      captureFrontPng(),
      captureBackPng(),
    ]);
    return [front, back];
  }

  async function saveImage(kind: "front" | "back" | "pair") {
    setBusy(true);
    try {
      const base = fileBase();
      if (kind === "front") {
        downloadDataUrl(await captureFrontPng(), `${base}-front.png`);
        setStatus({ kind: "success", en: "Front card image saved." });
        return;
      }
      if (kind === "back") {
        downloadDataUrl(await captureBackPng(), `${base}-back.png`);
        setStatus({ kind: "success", en: "Back card image saved." });
        return;
      }
      if (sheetUrl) {
        downloadDataUrl(sheetUrl, `${base}-front-back.png`);
      } else {
        const [front, back] = await Promise.all([
          captureFrontPng(),
          captureBackPng(),
        ]);
        downloadDataUrl(
          await stitchPngsSideBySide(front, back),
          `${base}-front-back.png`,
        );
      }
      setStatus({ kind: "success", en: "Front + back image saved." });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Save image failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function savePdf(kind: "front" | "back" | "pair") {
    setBusy(true);
    try {
      const base = fileBase();
      if (kind === "front") {
        await downloadPdfFromPngs(
          [await captureFrontPng()],
          `${base}-front.pdf`,
          { layout: "portrait" },
        );
        setStatus({ kind: "success", en: "Front card PDF saved." });
        return;
      }
      if (kind === "back") {
        await downloadPdfFromPngs(
          [await captureBackPng()],
          `${base}-back.pdf`,
          { layout: "portrait" },
        );
        setStatus({ kind: "success", en: "Back card PDF saved." });
        return;
      }
      const pngs = await capturePairPngs();
      await downloadPdfFromPngs(pngs, `${base}-front-back.pdf`, {
        layout: "landscape",
      });
      setStatus({ kind: "success", en: "Front + back PDF saved." });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Save PDF failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint(kind: "front" | "back" | "pair") {
    setBusy(true);
    try {
      if (kind === "front") {
        await printDataUrls([await captureFrontPng()], {
          title: "Print front",
          landscape: false,
        });
        setStatus({ kind: "success", en: "Print dialog opened (front)." });
        return;
      }
      if (kind === "back") {
        await printDataUrls([await captureBackPng()], {
          title: "Print back",
          landscape: false,
        });
        setStatus({ kind: "success", en: "Print dialog opened (back)." });
        return;
      }
      if (sheetUrl) {
        await printDataUrl(sheetUrl);
      } else {
        const pngs = await capturePairPngs();
        await printDataUrls(pngs, {
          title: "Print front + back",
          landscape: true,
        });
      }
      setStatus({ kind: "success", en: "Print dialog opened (front + back)." });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Print failed.",
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
            Photo → Gemini anime/chibi → print two pairs (Dana &amp; Friends and
            your name). Example cards are the <em>quality bar</em> — not a theme
            picker.
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

          <div className="mx-auto w-full max-w-[400px] space-y-3">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setBackPreview("dana")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  backPreview === "dana"
                    ? "bg-black text-white"
                    : "bg-black/5 text-black/55"
                }`}
              >
                Dana &amp; Friends
              </button>
              <button
                type="button"
                onClick={() => setBackPreview("name")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  backPreview === "name"
                    ? "bg-black text-white"
                    : "bg-black/5 text-black/55"
                }`}
              >
                {(draft.name.trim() || "FRIEND") + " & Friends"}
              </button>
            </div>
            <div ref={backRef}>
              {backPreview === "dana" ? (
                <CardBack
                  theme={theme}
                  title="Dana & Friends"
                  footer="Dana’s Special Card • 2026"
                  /* Brand back keeps stock friends art — never swap the background. */
                />
              ) : (
                <CardBack
                  theme={theme}
                  title={`${(draft.name.trim() || "FRIEND")} & Friends`}
                  footer={`${(draft.name.trim() || "FRIEND").toUpperCase()}'S SPECIAL CARD • 2026`}
                  sceneUrl={friendsSceneUrl}
                />
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-black/10 bg-white/80 p-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/45">
                  Save image
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveImage("front")}
                    className="rounded-xl bg-black px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveImage("back")}
                    className="rounded-xl bg-black px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveImage("pair")}
                    className="rounded-xl bg-black px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    Front + Back
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/45">
                  Print
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handlePrint("front")}
                    className="rounded-xl border-2 border-black/20 bg-[#FFF4A8] px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handlePrint("back")}
                    className="rounded-xl border-2 border-black/20 bg-[#FFF4A8] px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handlePrint("pair")}
                    className="rounded-xl border-2 border-black/20 bg-[#FFF4A8] px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Front + Back
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/45">
                  Save PDF
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePdf("front")}
                    className="rounded-xl border-2 border-black bg-white px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePdf("back")}
                    className="rounded-xl border-2 border-black bg-white px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePdf("pair")}
                    className="rounded-xl border-2 border-black bg-white px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Front + Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm backdrop-blur md:p-5">
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
                data-field="hp"
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
              data-field="caption"
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

          <label
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3"
            data-random-trio="1"
          >
            <input
              type="checkbox"
              checked={randomTrio}
              onChange={(e) => onToggleRandomTrio(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-black"
              data-field="random-trio"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-bold">
                Random HP, caption, and palette
              </span>
              <span className="block text-[11px] font-medium text-black/55">
                When on, rolls all three now and again on every photo generate.
                Caption rolls a preset only (not AI from photo).
              </span>
            </span>
          </label>

          <div className="space-y-3">
            {(
              [
                {
                  id: "attack1" as const,
                  label: "Attack 1",
                  name: draft.attack1Name,
                  apply: (atk: (typeof ATTACK_OPTIONS)[number]) =>
                    patchDraft({
                      attack1Name: atk.name,
                      attack1Damage: atk.damage,
                      attack1Text: atk.description,
                    }),
                },
                {
                  id: "attack2" as const,
                  label: "Attack 2",
                  name: draft.attack2Name,
                  apply: (atk: (typeof ATTACK_OPTIONS)[number]) =>
                    patchDraft({
                      attack2Name: atk.name,
                      attack2Damage: atk.damage,
                      attack2Text: atk.description,
                    }),
                },
              ] as const
            ).map((slot) => (
              <div key={slot.id} className="space-y-2" data-field={slot.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-black/50">
                    {slot.label}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-black/55">
                    {slot.name}
                    {slot.id === "attack1"
                      ? ` · ${draft.attack1Damage}`
                      : ` · ${draft.attack2Damage}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ATTACK_OPTIONS.map((opt) => {
                    const active = slot.name === opt.name;
                    return (
                      <button
                        key={`${slot.id}-${opt.id}`}
                        type="button"
                        onClick={() => slot.apply(opt)}
                        className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-bold ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white"
                        }`}
                        aria-pressed={active}
                        title={opt.description}
                      >
                        <span className="block leading-tight">{opt.name}</span>
                        <span
                          className={`block text-[10px] font-semibold ${
                            active ? "text-white/70" : "text-black/45"
                          }`}
                        >
                          {opt.damage} dmg
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[11px] font-medium text-black/55">
              Pick Attack 1 and Attack 2 independently. Both show on the card
              and go into the Gemini print prompt.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50">
              Chrome palette
            </p>
            <div className="flex flex-wrap gap-2" data-field="palette">
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
                    if (!portraitUrl && !photoBlobRef.current) {
                      setArtUrl(t.starterArt || STARTER_ART);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold ${
                    draft.paletteId === t.id
                      ? "border-black shadow"
                      : "border-black/10 opacity-80"
                  }`}
                  style={{ background: t.accentSoft }}
                  data-palette={t.id}
                  aria-pressed={draft.paletteId === t.id}
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
                    className={`rounded-xl border px-3 py-2 text-left ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
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
              Used for Photo → Gemini. Failures show the real API error for the
              selected model (no silent substitute).
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-black/70">
              Capture or upload → Gemini stylizes the front portrait and a
              personalized friends-party scene for the name back. Dana &amp;
              Friends keeps the classic brand background art.
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
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>

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
        className="pointer-events-none absolute -left-[9999px] top-0 w-[1100px] space-y-8 bg-white"
        style={{ backgroundColor: "#FFFFFF" }}
        aria-hidden
      >
        <PrintSheet
          data={data}
          cardName={draft.name}
          friendsSceneUrl={friendsSceneUrl}
          pair="dana"
        />
        <PrintSheet
          data={data}
          cardName={draft.name}
          friendsSceneUrl={friendsSceneUrl}
          pair="name"
        />
      </div>

      {showPrint && (
        <div
          className="space-y-4 bg-white p-2"
          style={{ backgroundColor: "#FFFFFF" }}
          data-print-studio="1"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Print pairs</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setPrintView("both")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    printView === "both"
                      ? "bg-black text-white"
                      : "text-black/55"
                  }`}
                >
                  Both pairs
                </button>
                <button
                  type="button"
                  onClick={() => setPrintView("switch")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    printView === "switch"
                      ? "bg-black text-white"
                      : "text-black/55"
                  }`}
                >
                  One at a time
                </button>
              </div>
              <button
                type="button"
                className="text-sm font-bold underline"
                onClick={() => setShowPrint(false)}
              >
                Hide
              </button>
            </div>
          </div>
          <p className="text-xs font-medium text-black/55">
            Two separate 2-up sheets — front | back, #FFFFFF page, dashed fold
            line only. Dana &amp; Friends keeps stock back art; name back may
            use the personalized friends scene.
          </p>
          {printView === "switch" ? (
            <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] p-1">
              <button
                type="button"
                onClick={() => setPrintPair("dana")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  printPair === "dana"
                    ? "bg-black text-white"
                    : "text-black/55"
                }`}
              >
                Dana &amp; Friends pair
              </button>
              <button
                type="button"
                onClick={() => setPrintPair("name")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  printPair === "name"
                    ? "bg-black text-white"
                    : "text-black/55"
                }`}
              >
                {(draft.name.trim() || "FRIEND") + " & Friends pair"}
              </button>
            </div>
          ) : null}
          {sheetUrl && printPair === "dana" ? (
            <div className="space-y-2 bg-white">
              <p className="text-xs font-bold uppercase tracking-wider text-black/50">
                Gemini A4 — front + Dana &amp; Friends back
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sheetUrl}
                alt="Gemini A4 print sheet — front and Dana & Friends back"
                className="w-full rounded-2xl border border-black/10 bg-white shadow"
              />
            </div>
          ) : null}
          {(printView === "both" || printPair === "dana") && (
            <div
              className="space-y-2 bg-white"
              style={{ backgroundColor: "#FFFFFF" }}
              data-pair-sheet="dana"
            >
              <PrintSheet
                data={data}
                cardName={draft.name}
                friendsSceneUrl={friendsSceneUrl}
                pair="dana"
              />
            </div>
          )}
          {(printView === "both" || printPair === "name") && (
            <div
              className="space-y-2 bg-white"
              style={{ backgroundColor: "#FFFFFF" }}
              data-pair-sheet="name"
            >
              <PrintSheet
                data={data}
                cardName={draft.name}
                friendsSceneUrl={friendsSceneUrl}
                pair="name"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
