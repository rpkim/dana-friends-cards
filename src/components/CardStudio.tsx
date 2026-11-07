"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { InstagramBirthdayPost } from "@/components/InstagramBirthdayPost";
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
  type CaptionPreset,
} from "@/lib/captions";
import {
  downloadDataUrl,
  downloadPdfFromPngs,
  pngFileFromDataUrl,
  printDataUrls,
  rasterizeCard,
  rasterizeInstagramPost,
  stitchPngsSideBySide,
  canShareImageFile,
} from "@/lib/exportCard";
import {
  deleteSavedCard,
  isCloudAssetUrl,
  listSavedCards,
  saveCard,
  updateSavedCard,
  type SavedCard,
} from "@/lib/cardLibrary";
import { ATTACK_OPTIONS, type AttackOption } from "@/lib/attacks";
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
  refineFailure,
  refineLoading,
  refineSuccess,
  stylizeLoading,
  stylizeSuccess,
  type StatusMsg,
} from "@/lib/statusCopy";
import { rollSpecialTreatment, WEAKNESS_OPTIONS } from "@/lib/cardRoll";
import { THEME_LIST, type CardSpecial, type PaletteId } from "@/lib/themes";

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

/** Cute type labels. Energy Type is the electric-palette default. */
export const TYPE_LABEL_OPTIONS = [
  "Energy Type",
  "Snack Type",
  "Friendship Type",
  "Sparkle Type",
  "Outdoor Type",
  "Dream Type",
  "Hug Type",
  "Star Type",
] as const;

function randomTypeLabel(): string {
  return TYPE_LABEL_OPTIONS[
    Math.floor(Math.random() * TYPE_LABEL_OPTIONS.length)
  ]!;
}

export type RandomCardRoll = {
  hp: number;
  caption: CaptionPreset;
  paletteId: PaletteId;
  typeLabel: string;
  weakness: string;
  special: CardSpecial | null;
  attack1: AttackOption;
  attack2: AttackOption;
};

/** Local pick used only after a photo generate succeeds. */
function draftWithRoll(base: CardDraft, roll: RandomCardRoll | null): CardDraft {
  if (!roll) return base;
  return {
    ...base,
    hp: roll.hp,
    caption: roll.caption,
    paletteId: roll.paletteId,
    typeLabel: roll.typeLabel,
    attack1Name: roll.attack1.name,
    attack1Damage: roll.attack1.damage,
    attack1Text: roll.attack1.description,
    attack1Custom: false,
    attack2Name: roll.attack2.name,
    attack2Damage: roll.attack2.damage,
    attack2Text: roll.attack2.description,
    attack2Custom: false,
    weakness: roll.weakness,
    special: roll.special ?? undefined,
  };
}

const CUSTOM_ATTACK_ID = "custom";

/** Custom stays selected after a typed name happens to match a preset. */
function attackIsCustom(name: string, text: string, custom?: boolean): boolean {
  if (custom) return true;
  return !ATTACK_OPTIONS.some((o) => o.name === name && o.description === text);
}

export function rollRandomCard(): RandomCardRoll {
  const pool = ATTACK_OPTIONS;
  const first = Math.floor(Math.random() * pool.length);
  let second = Math.floor(Math.random() * (pool.length - 1));
  if (second >= first) second += 1;
  return {
    hp: randomHp(),
    caption: randomCaption(),
    paletteId: randomPaletteId(),
    typeLabel: randomTypeLabel(),
    weakness:
      WEAKNESS_OPTIONS[Math.floor(Math.random() * WEAKNESS_OPTIONS.length)]!,
    special: rollSpecialTreatment(),
    attack1: pool[first]!,
    attack2: pool[second]!,
  };
}

function AttackPick({
  id,
  label,
  name,
  text,
  damage,
  custom,
  onPick,
  onCustom,
  onName,
  onText,
  onDamage,
  selectClassName,
  showText,
  disabled,
}: {
  id: string;
  label: string;
  name: string;
  text?: string;
  damage: number;
  custom?: boolean;
  onPick: (atk: AttackOption) => void;
  onCustom: () => void;
  onName: (name: string) => void;
  onText: (text: string) => void;
  onDamage: (damage: number) => void;
  selectClassName: string;
  showText?: boolean;
  disabled?: boolean;
}) {
  const description = text ?? "";
  const matched = ATTACK_OPTIONS.find(
    (o) => o.name === name && o.description === description,
  );
  const customMode = attackIsCustom(name, description, custom);
  const selected = customMode ? CUSTOM_ATTACK_ID : (matched?.id ?? CUSTOM_ATTACK_ID);
  return (
    <div className={`space-y-1 ${disabled ? "opacity-50" : ""}`} data-field={id}>
      <label className="block text-sm font-semibold" htmlFor={`${id}-select`}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <select
          id={`${id}-select`}
          value={selected}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === CUSTOM_ATTACK_ID) {
              onCustom();
              return;
            }
            const atk = ATTACK_OPTIONS.find((o) => o.id === e.target.value);
            if (atk) onPick(atk);
          }}
          className={`${selectClassName} disabled:cursor-not-allowed`}
        >
          {!selected ? <option value="">Select…</option> : null}
          <option value={CUSTOM_ATTACK_ID}>Custom</option>
          {ATTACK_OPTIONS.map((opt) => (
            <option key={`${id}-${opt.id}`} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="numeric"
          aria-label={`${label} damage`}
          value={damage}
          disabled={disabled}
          data-field={`${id}-damage`}
          onChange={(e) => onDamage(Number(e.target.value) || 0)}
          className="w-16 shrink-0 rounded-xl border-2 border-black bg-white px-2 py-2 text-center text-sm font-bold tabular-nums outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed"
        />
      </div>
      {customMode ? (
        <div className="space-y-1">
          <input
            id={`${id}-name`}
            aria-label={`${label} name`}
            value={name}
            placeholder="Attack name"
            disabled={disabled}
            data-field={`${id}-name`}
            onChange={(e) => onName(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-bold outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed"
          />
          <textarea
            id={`${id}-text`}
            aria-label={`${label} description`}
            value={description}
            placeholder="Attack description"
            rows={2}
            disabled={disabled}
            data-field={`${id}-text`}
            onChange={(e) => onText(e.target.value)}
            className="w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium leading-snug outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed"
          />
        </div>
      ) : showText && description ? (
        <span className="block text-[11px] font-medium leading-snug text-black/55">
          {description}
        </span>
      ) : null}
    </div>
  );
}

type EditableSnapshot = {
  name: string;
  hp: number;
  typeLabel: string;
  caption: string;
  attack1Name: string;
  attack1Damage: number;
  attack1Text: string;
  attack1Custom: boolean;
  attack2Name: string;
  attack2Damage: number;
  attack2Text: string;
  attack2Custom: boolean;
  paletteId: PaletteId;
  weakness: string;
};

function editableSnapshot(draft: CardDraft): EditableSnapshot {
  return {
    name: draft.name,
    hp: draft.hp,
    typeLabel: draft.typeLabel,
    caption: draft.caption,
    attack1Name: draft.attack1Name,
    attack1Damage: draft.attack1Damage,
    attack1Text: draft.attack1Text,
    attack1Custom: Boolean(draft.attack1Custom),
    attack2Name: draft.attack2Name,
    attack2Damage: draft.attack2Damage,
    attack2Text: draft.attack2Text,
    attack2Custom: Boolean(draft.attack2Custom),
    paletteId: draft.paletteId,
    weakness: draft.weakness,
  };
}

function sameEditableSnapshot(a: EditableSnapshot, b: EditableSnapshot) {
  return (
    a.name === b.name &&
    a.hp === b.hp &&
    a.typeLabel === b.typeLabel &&
    a.caption === b.caption &&
    a.attack1Name === b.attack1Name &&
    a.attack1Damage === b.attack1Damage &&
    a.attack1Text === b.attack1Text &&
    a.attack1Custom === b.attack1Custom &&
    a.attack2Name === b.attack2Name &&
    a.attack2Damage === b.attack2Damage &&
    a.attack2Text === b.attack2Text &&
    a.attack2Custom === b.attack2Custom &&
    a.paletteId === b.paletteId &&
    a.weakness === b.weakness
  );
}

export function CardStudio({
  hideImageModel = false,
}: {
  /** /show hides the model picker. The default model is still sent. */
  hideImageModel?: boolean;
} = {}) {
  const [draft, setDraft] = useState<CardDraft>(() => draftFromPalette("electric"));
  const [artUrl, setArtUrl] = useState(STARTER_ART);
  const [exampleRef, setExampleRef] = useState("/examples/dana.webp");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL_ID);
  const [busy, setBusy] = useState(false);
  /** True only while Gemini is painting — not during save / print. */
  const [artBusy, setArtBusy] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(READY_STATUS);
  const [saveResultsOpen, setSaveResultsOpen] = useState(false);
  const [canSaveToPhotos, setCanSaveToPhotos] = useState(false);
  const [photoShare, setPhotoShare] = useState<File | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  /** Kept with the card so a saved library entry can restore a generated scene. */
  const [friendsSceneUrl, setFriendsSceneUrl] = useState<string | null>(null);
  /** Stylized portrait for the live front art frame. */
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [captionSelect, setCaptionSelect] = useState<string>(DEFAULT_CAPTION);
  /** When on, the next successful photo generate rolls the card stats. */
  const [randomTrio, setRandomTrio] = useState(true);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineBusy, setRefineBusy] = useState(false);
  /** Library row this session should update. A new photo generate starts a new row. */
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const activeSavedIdRef = useRef<string | null>(null);
  /** Portraits from before each refine, newest last. */
  const [portraitUndo, setPortraitUndo] = useState<string[]>([]);

  useEffect(() => {
    setImageModel(readStoredImageModel());
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSavedCards()
      .then((cards) => {
        if (cancelled) return;
        setSavedCards(cards);
      })
      .catch(() => {
        if (!cancelled) setSavedCards([]);
      });
    return () => {
      cancelled = true;
    };
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
    const special = q.get("special");
    const draftPatch: Partial<CardDraft> = {};
    if (name) draftPatch.name = name;
    if (special === "gold" || special === "rainbow") draftPatch.special = special;
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
    }
    if (scene) {
      setFriendsSceneUrl(scene);
    }
    if (wantRandom) setRandomTrio(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, imageModel);
    } catch {
      /* ignore */
    }
  }, [imageModel]);

  const printRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const photoBlobRef = useRef<Blob | null>(null);
  const refineLock = useRef(false);
  const saveResultsBtnRef = useRef<HTMLButtonElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [instagramShare, setInstagramShare] = useState<File | null>(null);
  /** Fields last written for the active library card. Null until a card exists. */
  const [savedSnapshot, setSavedSnapshot] = useState<EditableSnapshot | null>(null);

  const theme = useMemo(() => themeFromDraft(draft), [draft]);
  const cardDirty =
    savedSnapshot !== null &&
    activeSavedId !== null &&
    !sameEditableSnapshot(savedSnapshot, editableSnapshot(draft));

  const data: CardData = useMemo(
    () => ({
      theme,
      artUrl,
      artBusy,
      customName: draft.name || undefined,
      customHp: draft.hp,
    }),
    [theme, artUrl, artBusy, draft.name, draft.hp],
  );

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!portraitUrl) setSaveResultsOpen(false);
  }, [portraitUrl]);

  useEffect(() => {
    if (!saveResultsOpen) {
      setPhotoShare(null);
      setInstagramShare(null);
      setInstagramError(null);
      return;
    }
    setCanSaveToPhotos(canShareImageFile());
    setInstagramError(null);
  }, [saveResultsOpen]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function patchDraft(patch: Partial<CardDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function applyRandomCard(roll: RandomCardRoll) {
    setCaptionSelect(roll.caption);
    setDraft((d) => ({
      ...d,
      hp: roll.hp,
      caption: roll.caption,
      paletteId: roll.paletteId,
      typeLabel: roll.typeLabel,
      attack1Name: roll.attack1.name,
      attack1Damage: roll.attack1.damage,
      attack1Text: roll.attack1.description,
      attack1Custom: false,
      attack2Name: roll.attack2.name,
      attack2Damage: roll.attack2.damage,
      attack2Text: roll.attack2.description,
      attack2Custom: false,
      weakness: roll.weakness,
      special: roll.special ?? undefined,
    }));
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
    setPortraitUrl(null);
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
    setArtBusy(true);
    setStatus(stylizeLoading());
    photoBlobRef.current = blob;

    // Roll locally for this generate. Show the new values only if it succeeds.
    const roll = randomTrio ? rollRandomCard() : null;
    let paletteId = draft.paletteId;
    let hp = draft.hp;
    let caption = draft.caption;
    let typeLabel = draft.typeLabel;
    let attack1Name = draft.attack1Name;
    let attack1Damage = draft.attack1Damage;
    let attack1Text = draft.attack1Text;
    let attack2Name = draft.attack2Name;
    let attack2Damage = draft.attack2Damage;
    let attack2Text = draft.attack2Text;
    let weakness = draft.weakness;
    if (roll) {
      paletteId = roll.paletteId;
      hp = roll.hp;
      caption = roll.caption;
      typeLabel = roll.typeLabel;
      attack1Name = roll.attack1.name;
      attack1Damage = roll.attack1.damage;
      attack1Text = roll.attack1.description;
      attack2Name = roll.attack2.name;
      attack2Damage = roll.attack2.damage;
      attack2Text = roll.attack2.description;
      weakness = roll.weakness;
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
      form.append("attack1Name", attack1Name);
      form.append("attack1Damage", String(attack1Damage));
      form.append("attack1Text", attack1Text);
      form.append("attack2Name", attack2Name);
      form.append("attack2Damage", String(attack2Damage));
      form.append("attack2Text", attack2Text);
      form.append("weakness", weakness);
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
      const scene = json.friendsScene || json.nameBack || null;
      if (scene) setFriendsSceneUrl(scene);
      if (json.portrait || scene) {
        const nextDraft = draftWithRoll(draft, roll);
        if (roll) applyRandomCard(roll);
        if (json.portrait && portraitUrl && portraitUrl !== json.portrait) {
          setPortraitUndo((stack) => [...stack, portraitUrl]);
        } else {
          setPortraitUndo([]);
        }
        if (json.portrait) {
          try {
            activeSavedIdRef.current = null;
            await persistLibrary({
              draft: nextDraft,
              portraitUrl: json.portrait,
              friendsSceneUrl: scene,
            });
            setStatus({
              kind: "success",
              en: `Portrait ready and saved${json.model ? ` (${json.model})` : ""}. Saved cards has this name, HP, attacks, palette, and picture.`,
            });
          } catch (err) {
            setStatus({
              kind: "error",
              en:
                err instanceof Error
                  ? `Portrait ready, but saving it failed. ${err.message}`
                  : "Portrait ready, but saving it failed.",
            });
          }
        } else {
          setStatus(stylizeSuccess(json.model));
        }
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
      setArtBusy(false);
      setBusy(false);
    }
  }

  async function currentPortraitFile(url: string): Promise<File> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Could not read the current portrait (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    if (!blob.size) throw new Error("The current portrait is empty.");
    const mediaType = blob.type || "image/jpeg";
    const ext = mediaType.includes("png")
      ? "png"
      : mediaType.includes("webp")
        ? "webp"
        : "jpg";
    return new File([blob], `portrait.${ext}`, { type: mediaType });
  }

  async function runRefine() {
    const instruction = refineInstruction.trim();
    if (refineLock.current || busy || artBusy) return;
    if (!portraitUrl) return;
    if (!instruction) {
      setStatus({
        kind: "error",
        en: "Type what to change on the portrait.",
      });
      return;
    }

    refineLock.current = true;
    setRefineBusy(true);
    setBusy(true);
    setArtBusy(true);
    setStatus(refineLoading());

    try {
      const file = await currentPortraitFile(portraitUrl);
      const form = new FormData();
      form.append("image", file);
      form.append("instruction", instruction);
      form.append("imageModel", imageModel);
      const res = await fetch("/api/refine", { method: "POST", body: form });
      let json: {
        portrait?: string;
        reason?: string;
        error?: string;
        message?: string;
        billing?: boolean;
        httpStatus?: number;
        errorKind?: string;
        model?: string;
      } = {};
      const rawText = await res.text();
      try {
        json = rawText ? (JSON.parse(rawText) as typeof json) : {};
      } catch {
        json = {
          reason: rawText.trim().slice(0, 360) || `Refine failed (HTTP ${res.status}).`,
        };
      }
      if (json.portrait) {
        const previous = portraitUrl;
        setPortraitUndo((stack) => [...stack, previous]);
        setPortraitUrl(json.portrait);
        setArtUrl(json.portrait);
        setRefineInstruction("");
        try {
          await persistLibrary({
            draft,
            portraitUrl: json.portrait,
            friendsSceneUrl,
          });
          setStatus(refineSuccess(json.model));
        } catch (err) {
          setStatus({
            kind: "error",
            en:
              err instanceof Error
                ? `Portrait refined, but saving it failed. ${err.message}`
                : "Portrait refined, but saving it failed.",
          });
        }
        return;
      }
      const reason =
        (json.reason || json.message || json.error || "").trim() ||
        (res.ok
          ? "Refine returned no portrait."
          : `Refine failed (HTTP ${res.status}).`);
      setStatus(
        refineFailure({
          reason,
          billing: json.billing,
          httpStatus: json.httpStatus ?? (res.ok ? undefined : res.status),
          errorKind: json.errorKind,
        }),
      );
    } catch (err) {
      setStatus(
        refineFailure({
          reason: err instanceof Error ? err.message : "Refine failed.",
        }),
      );
    } finally {
      refineLock.current = false;
      setRefineBusy(false);
      setArtBusy(false);
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

  async function captureFace(side: "front" | "back") {
    const node = printRef.current?.querySelector(
      `[data-export-sheet="dana"] .card-${side}`,
    );
    if (!(node instanceof HTMLElement)) {
      throw new Error("The print pair is not ready yet.");
    }
    return rasterizeCard(node);
  }

  function rememberActive(id: string | null) {
    activeSavedIdRef.current = id;
    setActiveSavedId(id);
  }

  function upsertSaved(entry: SavedCard) {
    setSavedCards((list) =>
      [entry, ...list.filter((row) => row.id !== entry.id)].sort((a, b) =>
        a.draft.cardNo.localeCompare(b.draft.cardNo),
      ),
    );
  }

  async function persistLibrary(input: {
    draft: CardDraft;
    portraitUrl: string;
    friendsSceneUrl: string | null;
  }) {
    const name = input.draft.name.trim() || "Friend";
    const id = activeSavedIdRef.current;
    let entry: SavedCard | null = null;
    if (id) {
      entry = await updateSavedCard(id, {
        name,
        draft: input.draft,
        portraitUrl: input.portraitUrl,
        friendsSceneUrl: input.friendsSceneUrl,
      });
    }
    if (!entry) {
      entry = await saveCard({
        name,
        draft: input.draft,
        portraitUrl: input.portraitUrl,
        friendsSceneUrl: input.friendsSceneUrl,
      });
      rememberActive(entry.id);
    }
    upsertSaved(entry);
    setDraft(entry.draft);
    setSavedSnapshot(editableSnapshot(entry.draft));
    return entry;
  }

  async function rememberCard() {
    const portrait = portraitUrl || artUrl;
    if (!portrait) throw new Error("There is no portrait to save yet.");
    await persistLibrary({
      draft,
      portraitUrl: portrait,
      friendsSceneUrl,
    });
  }

  async function undoPortrait() {
    const previous = portraitUndo[portraitUndo.length - 1];
    if (!previous || busy || artBusy) return;
    setBusy(true);
    setPortraitUndo((stack) => stack.slice(0, -1));
    setPortraitUrl(previous);
    setArtUrl(previous);
    try {
      await persistLibrary({
        draft,
        portraitUrl: previous,
        friendsSceneUrl,
      });
      setStatus({
        kind: "success",
        en: "Reverted to the previous portrait and saved that version.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Could not save the undone portrait.",
      });
    } finally {
      setBusy(false);
    }
  }

  function loadSaved(entry: SavedCard) {
    rememberActive(entry.id);
    setPortraitUndo([]);
    setDraft(entry.draft);
    setSavedSnapshot(editableSnapshot(entry.draft));
    setArtUrl(entry.portraitUrl);
    setPortraitUrl(entry.portraitUrl);
    setFriendsSceneUrl(entry.friendsSceneUrl);
    setCaptionSelect(
      isCaptionPreset(entry.draft.caption) ? entry.draft.caption : entry.draft.caption,
    );
    const sceneOnlyInCloud = isCloudAssetUrl(entry.friendsSceneUrl);
    setStatus({
      kind: sceneOnlyInCloud ? "error" : "success",
      en: sceneOnlyInCloud
        ? `Loaded ${entry.name}. The friends scene is only a cloud link, so it was left out. Portrait, name, and stats are loaded.`
        : `Loaded ${entry.name}.`,
    });
  }

  async function removeSaved(id: string) {
    try {
      await deleteSavedCard(id);
      const rows = await listSavedCards();
      setSavedCards(rows);
      if (activeSavedIdRef.current === id) {
        rememberActive(null);
        setSavedSnapshot(null);
      } else if (activeSavedIdRef.current) {
        const still = rows.find((row) => row.id === activeSavedIdRef.current);
        if (still) setDraft((current) => ({ ...current, cardNo: still.draft.cardNo }));
      }
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Could not delete the card.",
      });
    }
  }

  async function saveImage(kind: "front" | "both") {
    setBusy(true);
    try {
      const base = fileBase();
      if (kind === "front") {
        downloadDataUrl(await captureFace("front"), `${base}-front.png`);
      } else {
        const front = await captureFace("front");
        const back = await captureFace("back");
        downloadDataUrl(
          await stitchPngsSideBySide(front, back),
          `${base}-front-back.png`,
        );
      }
      await rememberCard();
      setStatus({
        kind: "success",
        en:
          kind === "front"
            ? "Front card image saved and added to your library."
            : "Front and Dana back saved side by side, and added to your library.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Save image failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function preparePhotoShare(kind: "front" | "both") {
    setBusy(true);
    setPhotoShare(null);
    try {
      const base = fileBase();
      const dataUrl =
        kind === "front"
          ? await captureFace("front")
          : await stitchPngsSideBySide(
              await captureFace("front"),
              await captureFace("back"),
            );
      const filename = kind === "front" ? `${base}-front.png` : `${base}-front-back.png`;
      setPhotoShare(pngFileFromDataUrl(dataUrl, filename));
      setStatus({
        kind: "success",
        en:
          kind === "front"
            ? "Front image is ready. Tap Save to photos."
            : "Front and Dana back image is ready. Tap Save to photos.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Could not prepare the image.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function sharePreparedPhoto() {
    const file = photoShare;
    if (!file || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ files: [file], title: file.name });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Could not open the share sheet.",
      });
    }
  }

  async function saveInstagram() {
    setBusy(true);
    setInstagramError(null);
    setInstagramShare(null);
    try {
      const node = instagramRef.current;
      if (!(node instanceof HTMLElement)) {
        throw new Error("The birthday post is not ready yet.");
      }
      const png = await rasterizeInstagramPost(node);
      downloadDataUrl(png, "dana-7th-birthday.png");
      if (canSaveToPhotos) {
        setInstagramShare(pngFileFromDataUrl(png, "dana-7th-birthday.png"));
      }
      setStatus({
        kind: "success",
        en: canSaveToPhotos
          ? "Saved dana-7th-birthday.png. Tap Save to photos to add it to your gallery."
          : "Saved dana-7th-birthday.png, a 1080 × 1080 birthday square.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save the Instagram image.";
      setInstagramError(message);
      setStatus({ kind: "error", en: message });
    } finally {
      setBusy(false);
    }
  }

  async function shareInstagramPhoto() {
    const file = instagramShare;
    if (!file || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ files: [file], title: file.name });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "Could not open the share sheet.";
      setInstagramError(message);
      setStatus({ kind: "error", en: message });
    }
  }

  async function saveFieldChanges() {
    const id = activeSavedIdRef.current;
    if (!id || !savedSnapshot) return;
    setBusy(true);
    try {
      const name = draft.name.trim() || "Friend";
      const portrait = portraitUrl || artUrl;
      if (!portrait) throw new Error("There is no portrait to save yet.");
      const entry = await updateSavedCard(id, {
        name,
        draft,
        portraitUrl: portrait,
        friendsSceneUrl,
      });
      if (!entry) throw new Error("That card is no longer in the library.");
      upsertSaved(entry);
      setDraft(entry.draft);
      setSavedSnapshot(editableSnapshot(entry.draft));
      setStatus({
        kind: "success",
        en: `Updated ${name}.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Could not update the card.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function savePdf(kind: "front" | "both") {
    setBusy(true);
    try {
      const base = fileBase();
      if (kind === "front") {
        await downloadPdfFromPngs([await captureFace("front")], `${base}-front.pdf`);
        setStatus({
          kind: "success",
          en: "Front PDF saved. Print at 100% so the card stays 63.5 × 88.9 mm.",
        });
        return;
      }
      const front = await captureFace("front");
      const back = await captureFace("back");
      await downloadPdfFromPngs([front, back], `${base}-front-back.pdf`, {
        caption:
          "Front  ·  Dana back     Print at 100% (actual size)  ·  63.5 × 88.9 mm",
      });
      setStatus({
        kind: "success",
        en: "Front and Dana back PDF saved. Print at 100% so each card stays 63.5 × 88.9 mm.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        en: err instanceof Error ? err.message : "Save PDF failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint(kind: "front" | "both") {
    setBusy(true);
    try {
      if (kind === "front") {
        await printDataUrls([await captureFace("front")], { title: "Print front" });
        setStatus({
          kind: "success",
          en: "Print dialog opened for the front card. Use 100% / actual size.",
        });
        return;
      }
      const front = await captureFace("front");
      const back = await captureFace("back");
      await printDataUrls([front, back], { title: "Print front and back" });
      setStatus({
        kind: "success",
        en: "Print dialog opened for the front and the Dana & Friends back. Use 100% / actual size.",
      });
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
        <div className="relative">
          <h1 className="font-display text-4xl font-bold leading-none tracking-tight md:text-6xl">
            Dana &amp; Friends Card Studio
          </h1>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <aside className="space-y-4 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm backdrop-blur md:p-5 lg:col-start-2 lg:row-start-1">
          <label className="block space-y-1 text-sm font-semibold">
            Card name
            <input
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
            />
          </label>
          <label
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3"
            data-random-trio="1"
          >
            <input
              type="checkbox"
              checked={randomTrio}
              onChange={(e) => setRandomTrio(e.target.checked)}
              className="h-4 w-4 accent-black"
              data-field="random-trio"
            />
            <span className="text-sm font-bold">Random card</span>
          </label>
          {!randomTrio ? (
            <>
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
                  <select
                    value={draft.typeLabel}
                    onChange={(e) => patchDraft({ typeLabel: e.target.value })}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
                    data-field="type-label"
                  >
                    {(TYPE_LABEL_OPTIONS as readonly string[]).includes(
                      draft.typeLabel,
                    ) ? null : (
                      <option value={draft.typeLabel}>{draft.typeLabel}</option>
                    )}
                    {TYPE_LABEL_OPTIONS.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2" data-section="attacks-aside">
                <AttackPick
                  id="aside-attack1"
                  label="Attack 1"
                  name={draft.attack1Name}
                  text={draft.attack1Text}
                  damage={draft.attack1Damage}
                  custom={draft.attack1Custom}
                  showText
                  selectClassName="min-w-0 flex-1 rounded-xl border-2 border-black/20 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
                  onPick={(atk) =>
                    patchDraft({
                      attack1Custom: false,
                      attack1Name: atk.name,
                      attack1Damage: atk.damage,
                      attack1Text: atk.description,
                    })
                  }
                  onCustom={() => patchDraft({ attack1Custom: true })}
                  onName={(attack1Name) =>
                    patchDraft({ attack1Name, attack1Custom: true })
                  }
                  onText={(attack1Text) =>
                    patchDraft({ attack1Text, attack1Custom: true })
                  }
                  onDamage={(attack1Damage) => patchDraft({ attack1Damage })}
                />
                <AttackPick
                  id="aside-attack2"
                  label="Attack 2"
                  name={draft.attack2Name}
                  text={draft.attack2Text}
                  damage={draft.attack2Damage}
                  custom={draft.attack2Custom}
                  showText
                  selectClassName="min-w-0 flex-1 rounded-xl border-2 border-black/20 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
                  onPick={(atk) =>
                    patchDraft({
                      attack2Custom: false,
                      attack2Name: atk.name,
                      attack2Damage: atk.damage,
                      attack2Text: atk.description,
                    })
                  }
                  onCustom={() => patchDraft({ attack2Custom: true })}
                  onName={(attack2Name) =>
                    patchDraft({ attack2Name, attack2Custom: true })
                  }
                  onText={(attack2Text) =>
                    patchDraft({ attack2Text, attack2Custom: true })
                  }
                  onDamage={(attack2Damage) => patchDraft({ attack2Damage })}
                />
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
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              <label className="block space-y-1 text-sm font-semibold">
                Weakness
                <select
                  value={draft.weakness}
                  onChange={(e) => patchDraft({ weakness: e.target.value })}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-bold outline-none ring-yellow-300 focus:ring-2"
                  data-field="weakness"
                >
                  {(WEAKNESS_OPTIONS as readonly string[]).includes(draft.weakness)
                    ? null
                    : (
                      <option value={draft.weakness}>{draft.weakness}</option>
                    )}
                  {WEAKNESS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {!randomTrio ? (
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
          ) : null}

          {cardDirty ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveFieldChanges()}
              className="w-full rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              data-action="save-changes"
            >
              Save changes
            </button>
          ) : null}

          {hideImageModel ? null : (
            <label className="block space-y-2" htmlFor="image-model">
              <span className="text-xs font-bold uppercase tracking-wider text-black/50">
                Image model
              </span>
              <select
                id="image-model"
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-bold outline-none ring-yellow-300 focus:ring-2"
                data-field="image-model"
                aria-describedby="image-model-help"
              >
                {IMAGE_MODEL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} · {opt.blurb}
                  </option>
                ))}
              </select>
              <p id="image-model-help" className="text-[11px] text-black/55">
                Used for Photo → Gemini. Failures show the real API error for the
                selected model (no silent substitute).
              </p>
            </label>
          )}

          <div className="space-y-3">
            <p className="text-sm text-black/70">
              Capture or upload → Gemini stylizes the front portrait. The
              printed back stays the classic Dana &amp; Friends art.
            </p>
            {cameraOn ? (
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/90">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="aspect-square w-full object-cover"
                />
              </div>
            ) : null}
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
            {portraitUrl ? (
              <>
              <form
                className="space-y-2 rounded-2xl border border-black/10 bg-black/[0.03] p-3"
                data-refine-portrait="1"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runRefine();
                }}
              >
                <label
                  className="block space-y-1 text-sm font-semibold"
                  htmlFor="refine-portrait"
                >
                  Refine portrait
                  <input
                    id="refine-portrait"
                    type="text"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Pink hair, wink, tiny crown…"
                    disabled={busy}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    data-field="refine-instruction"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    disabled={busy || !refineInstruction.trim()}
                    className="rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    data-action="refine-portrait"
                  >
                    {refineBusy ? "Refining…" : "Refine portrait"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || portraitUndo.length === 0}
                    onClick={() => void undoPortrait()}
                    className="rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold disabled:opacity-50"
                    data-action="undo-portrait"
                  >
                    Undo change
                  </button>
                </div>
                <p className="text-[11px] font-medium text-black/55">
                  Edits this portrait only, then saves that version. Undo
                  change restores the previous portrait. HP, attacks, palette,
                  and caption stay as they are.
                </p>
              </form>
              <button
                ref={saveResultsBtnRef}
                type="button"
                onClick={() => setSaveResultsOpen(true)}
                className="w-full rounded-xl bg-black px-3 py-2.5 text-sm font-bold text-white"
                data-action="save-results"
              >
                Save results
              </button>
              </>
            ) : null}
          </div>

          <SavedCardList
            cards={savedCards}
            activeId={activeSavedId}
            onOpen={loadSaved}
            onDelete={(id) => void removeSaved(id)}
          />

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

        <section className="grid min-w-0 grid-cols-1 items-start justify-items-center gap-4 lg:col-start-1 lg:row-start-1 lg:grid-cols-2">
          <div className="w-full min-w-0 max-w-[400px] [animation:card-float_4s_ease-in-out_infinite]">
            <CardFront data={data} />
          </div>

          <div className="w-full min-w-0 max-w-[400px]">
            <CardBack
              theme={theme}
              title="Dana & Friends"
              footer="Dana’s Special Card • 2026"
            />
          </div>
        </section>
      </div>

      <div
        ref={printRef}
        className="pointer-events-none absolute -left-[9999px] top-0 w-[1100px] space-y-8 bg-white"
        style={{ backgroundColor: "#FFFFFF" }}
        aria-hidden
      >
        <div data-export-sheet="dana">
          <PrintSheet
            data={data}
            cardName={draft.name}
            pair="dana"
            exportLayout
          />
        </div>
        {portraitUrl ? (
          <InstagramBirthdayPost
            postRef={instagramRef}
            data={{ ...data, artBusy: false }}
          />
        ) : null}
      </div>

      {saveResultsOpen ? (
        <SaveResultsDialog
          onClose={() => setSaveResultsOpen(false)}
          returnFocusRef={saveResultsBtnRef}
        >
          <p className="text-xs font-medium text-black/55">
            One pair — front beside the Dana &amp; Friends back. The back
            keeps the classic art.
          </p>
          <PairExportBar
            busy={busy}
            canSaveToPhotos={canSaveToPhotos}
            photoShareReady={!!photoShare}
            onSaveImage={(kind) => void saveImage(kind)}
            onPreparePhotoShare={(kind) => void preparePhotoShare(kind)}
            onSharePhoto={() => void sharePreparedPhoto()}
            onPrint={(kind) => void handlePrint(kind)}
            onSavePdf={(kind) => void savePdf(kind)}
            onSaveInstagram={() => void saveInstagram()}
            onShareInstagram={() => void shareInstagramPhoto()}
            instagramShareReady={!!instagramShare}
            instagramError={instagramError}
          />
          <div
            className="space-y-2 bg-white"
            style={{ backgroundColor: "#FFFFFF" }}
            data-pair-sheet="dana"
          >
            <PrintSheet data={data} cardName={draft.name} pair="dana" />
          </div>
        </SaveResultsDialog>
      ) : null}
    </div>
  );
}

function SaveResultsDialog({
  onClose,
  returnFocusRef,
  children,
}: {
  onClose: () => void;
  returnFocusRef: { current: HTMLButtonElement | null };
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (returnFocusRef.current) returnFocusRef.current.focus();
      else if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [returnFocusRef]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-results-title"
        data-save-results="1"
        className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-3xl bg-white text-black shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
          <h2 id="save-results-title" className="font-display text-xl font-bold">
            Save results
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/15 px-3 py-1.5 text-sm font-bold"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-3 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

function PairExportBar({
  busy,
  canSaveToPhotos,
  photoShareReady,
  onSaveImage,
  onPreparePhotoShare,
  onSharePhoto,
  onPrint,
  onSavePdf,
  onSaveInstagram,
  onShareInstagram,
  instagramShareReady,
  instagramError,
}: {
  busy: boolean;
  canSaveToPhotos: boolean;
  photoShareReady: boolean;
  onSaveImage: (kind: "front" | "both") => void;
  onPreparePhotoShare: (kind: "front" | "both") => void;
  onSharePhoto: () => void;
  onPrint: (kind: "front" | "both") => void;
  onSavePdf: (kind: "front" | "both") => void;
  onSaveInstagram: () => void;
  onShareInstagram: () => void;
  instagramShareReady: boolean;
  instagramError: string | null;
}) {
  return (
    <div
      className="space-y-3 rounded-2xl border border-black/10 bg-white p-3"
      data-print-export="1"
    >
      <ExportRow title="Save image">
        <FaceButtons
          busy={busy}
          className="rounded-xl bg-black px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
          onPick={onSaveImage}
          actionPrefix="save-image"
        />
      </ExportRow>
      {canSaveToPhotos ? (
        <ExportRow title="Save to photos">
          <FaceButtons
            busy={busy}
            className="rounded-xl border-2 border-black/20 bg-white px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
            onPick={onPreparePhotoShare}
            actionPrefix="prepare-photo"
          />
          {photoShareReady ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSharePhoto}
              className="w-full rounded-xl bg-[#2F6BFF] px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
              data-action="save-to-photos"
            >
              Save to photos
            </button>
          ) : (
            <p className="text-[11px] font-medium text-black/55">
              Choose Front only or both, then tap Save to photos.
            </p>
          )}
        </ExportRow>
      ) : null}
      <ExportRow title="Print">
        <FaceButtons
          busy={busy}
          className="rounded-xl border-2 border-black/20 bg-[#FFF4A8] px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
          onPick={onPrint}
          actionPrefix="print"
        />
      </ExportRow>
      <ExportRow title="Save PDF">
        <FaceButtons
          busy={busy}
          className="rounded-xl border-2 border-black bg-white px-2 py-2.5 text-[11px] font-bold disabled:opacity-50"
          onPick={onSavePdf}
          actionPrefix="save-pdf"
        />
      </ExportRow>
      <ExportRow title="Save for Instagram">
        <button
          type="button"
          disabled={busy}
          onClick={onSaveInstagram}
          className="w-full rounded-xl border-2 border-black bg-[#FF7AB8] px-3 py-2.5 text-sm font-bold disabled:opacity-50"
          data-action="save-instagram"
        >
          Save for Instagram
        </button>
        <p className="text-[11px] font-medium text-black/55">
          Square 1080 × 1080 birthday post with this card’s front inside.
        </p>
        {canSaveToPhotos && instagramShareReady ? (
          <button
            type="button"
            disabled={busy}
            onClick={onShareInstagram}
            className="w-full rounded-xl bg-[#2F6BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            data-action="save-instagram-photos"
          >
            Save to photos
          </button>
        ) : null}
        {instagramError ? (
          <p role="alert" className="text-xs font-bold text-red-700" data-instagram-error="1">
            {instagramError}
          </p>
        ) : null}
      </ExportRow>
    </div>
  );
}

function FaceButtons({
  busy,
  className,
  onPick,
  actionPrefix,
}: {
  busy: boolean;
  className: string;
  onPick: (kind: "front" | "both") => void;
  actionPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => onPick("front")}
        className={className}
        data-action={`${actionPrefix}-front`}
      >
        Front only
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onPick("both")}
        className={className}
        data-action={`${actionPrefix}-both`}
      >
        both
      </button>
    </div>
  );
}

function savedCardOptionLabel(card: SavedCard) {
  const when = new Date(card.updatedAt ?? card.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${card.draft.cardNo} · ${card.name} · ${when}`;
}

function SavedCardList({
  cards,
  activeId,
  onOpen,
  onDelete,
}: {
  cards: SavedCard[];
  activeId: string | null;
  onOpen: (card: SavedCard) => void;
  onDelete: (id: string) => void;
}) {
  const selected = cards.some((card) => card.id === activeId) ? (activeId ?? "") : "";
  const selectedCard = cards.find((card) => card.id === selected) ?? null;

  return (
    <div className="space-y-2 border-t border-black/10 pt-3" data-saved-cards="1">
      <div className="flex items-end gap-2">
        <label className="block min-w-0 flex-1 space-y-1" htmlFor="saved-cards">
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/45">
            Saved cards
          </span>
          <select
            id="saved-cards"
            value={selected}
            disabled={cards.length === 0}
            onChange={(e) => {
              const card = cards.find((row) => row.id === e.target.value);
              if (card) onOpen(card);
            }}
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-bold outline-none ring-yellow-300 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            data-field="saved-cards"
          >
            {cards.length === 0 ? (
              <option value="" disabled>
                No saved cards
              </option>
            ) : null}
            {cards.length > 0 && !selected ? (
              <option value="">Select a saved card</option>
            ) : null}
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {savedCardOptionLabel(card)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!selectedCard}
          onClick={() => {
            if (selectedCard) onDelete(selectedCard.id);
          }}
          className="shrink-0 rounded-xl border border-black/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black/55 underline disabled:cursor-not-allowed disabled:opacity-40"
          data-action="delete-saved-card"
          aria-label={selectedCard ? `Delete ${selectedCard.name}` : "Delete saved card"}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function ExportRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-black/45">
        {title}
      </p>
      {children}
    </div>
  );
}
