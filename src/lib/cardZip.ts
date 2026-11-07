import JSZip from "jszip";
import type { CardDraft, PaletteId } from "@/lib/cardModel";
import { isCloudAssetUrl, upsertSavedCard, type SavedCard } from "@/lib/cardLibrary";

export type CardsZipResult = {
  blob: Blob;
  /** Friends scenes that were not local bytes. The zip still has the rest of each card. */
  warnings: string[];
};

const PALETTES = new Set<PaletteId>(["electric", "autumn", "aura", "sparkle"]);
const ZIP_NAME = "dana-cards.zip";

type ZipCardMeta = {
  id: string;
  createdAt: number;
  updatedAt: number | null;
  name: string;
  draft: CardDraft;
  portraitFile: string;
  friendsSceneFile: string | null;
};

export async function buildCardsZip(cards: readonly SavedCard[]): Promise<CardsZipResult> {
  if (cards.length === 0) {
    throw new Error("Select at least one card to download.");
  }
  const zip = new JSZip();
  const warnings: string[] = [];
  const used = new Set<string>();
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index]!;
    const folder = uniqueFolder(card.id, index, used);
    const portrait = await readImage(card.portraitUrl, `portrait for ${cardLabel(card)}`);
    const portraitFile = `${folder}/portrait.${portrait.ext}`;
    zip.file(portraitFile, portrait.bytes);
    let friendsSceneFile: string | null = null;
    const sceneUrl = card.friendsSceneUrl?.trim() || "";
    if (sceneUrl) {
      if (isCloudAssetUrl(sceneUrl)) {
        warnings.push(cloudSceneWarning(card));
      } else {
        try {
          const scene = await readImage(sceneUrl, `friends scene for ${cardLabel(card)}`);
          friendsSceneFile = `${folder}/scene.${scene.ext}`;
          zip.file(friendsSceneFile, scene.bytes);
        } catch (err) {
          const detail =
            err instanceof Error
              ? err.message
              : `Could not read the friends scene for ${cardLabel(card)}.`;
          warnings.push(`${detail} The portrait, name, and stats are included.`);
        }
      }
    }
    const meta: ZipCardMeta = {
      id: card.id,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt ?? null,
      name: card.name,
      draft: card.draft,
      portraitFile,
      friendsSceneFile,
    };
    zip.file(`${folder}/card.json`, JSON.stringify(meta, null, 2));
  }
  return { blob: await zip.generateAsync({ type: "blob" }), warnings };
}

function cloudSceneWarning(card: SavedCard) {
  return `The friends scene for ${cardLabel(card)} is only a cloud link, so it was left out. The portrait, name, and stats are included.`;
}

export function downloadCardsZip(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ZIP_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Restore cards from a zip. The same card id replaces the existing library row. */
export async function importCardsZip(file: Blob): Promise<SavedCard[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("That file is not a card zip.");
  }
  const jsonPaths: string[] = [];
  zip.forEach((path, entry) => {
    if (!entry.dir && path.split("/").pop()?.toLowerCase() === "card.json") {
      jsonPaths.push(path);
    }
  });
  if (jsonPaths.length === 0) {
    throw new Error("This zip has no card metadata.");
  }
  const parsed: SavedCard[] = [];
  for (const path of jsonPaths) {
    parsed.push(await cardFromZip(zip, path));
  }
  const byId = new Map<string, SavedCard>();
  for (const card of parsed) byId.set(card.id, card);
  const cards = [...byId.values()];
  for (const card of cards) {
    await upsertSavedCard(card);
  }
  return cards;
}

function cardLabel(card: SavedCard) {
  return card.name.trim() || "this card";
}

function uniqueFolder(id: string, index: number, used: Set<string>) {
  const base = id.replace(/[^A-Za-z0-9_-]+/g, "").slice(0, 64) || `card-${index + 1}`;
  let folder = base;
  let n = 2;
  while (used.has(folder)) {
    folder = `${base}-${n}`;
    n += 1;
  }
  used.add(folder);
  return folder;
}

async function readImage(url: string, label: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return readDataUrlImage(trimmed, label);
  if (isCloudAssetUrl(trimmed)) {
    throw new Error(`Could not read the ${label}. It is only a cloud link.`);
  }
  let response: Response;
  try {
    response = await fetch(trimmed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Network error.";
    throw new Error(`Could not read the ${label}. ${detail}`);
  }
  if (!response.ok) {
    throw new Error(`Could not read the ${label} (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error(`The ${label} is empty.`);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mediaType = blob.type || sniffMediaType(bytes);
  const ext = extensionFor(mediaType);
  if (!ext) {
    throw new Error(`The ${label} is not a PNG, JPEG, WebP, or GIF.`);
  }
  return { bytes, ext };
}

function readDataUrlImage(url: string, label: string) {
  const comma = url.indexOf(",");
  if (comma < 0) throw new Error(`Could not read the ${label}.`);
  const meta = url.slice("data:".length, comma);
  const payload = url.slice(comma + 1);
  const parts = meta.split(";").map((part) => part.trim()).filter(Boolean);
  const isBase64 = parts.some((part) => part.toLowerCase() === "base64");
  const declared = (parts.find((part) => part.toLowerCase() !== "base64") ?? "").toLowerCase();
  let bytes: Uint8Array;
  try {
    if (isBase64) {
      const binary = atob(payload.replace(/\s/g, ""));
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(payload));
    }
  } catch {
    throw new Error(`Could not read the ${label}.`);
  }
  if (!bytes.byteLength) throw new Error(`The ${label} is empty.`);
  const mediaType = sniffMediaType(bytes) || declared;
  const ext = extensionFor(mediaType);
  if (!ext) throw new Error(`The ${label} is not a PNG, JPEG, WebP, or GIF.`);
  return { bytes, ext };
}

async function cardFromZip(zip: JSZip, jsonPath: string): Promise<SavedCard> {
  const jsonEntry = zip.file(jsonPath);
  if (!jsonEntry) throw new Error("This zip has no card metadata.");
  let raw: unknown;
  try {
    raw = JSON.parse(await jsonEntry.async("string"));
  } catch {
    throw new Error(`Could not read ${jsonPath}.`);
  }
  if (!raw || typeof raw !== "object") {
    throw new Error(`Could not read ${jsonPath}.`);
  }
  const meta = raw as Record<string, unknown>;
  const id = readId(meta.id);
  const name = readString(meta.name, "card name");
  const createdAt = readNumber(meta.createdAt, name || id, "created time");
  const updatedAt =
    meta.updatedAt == null ? undefined : readNumber(meta.updatedAt, name || id, "updated time");
  const draft = readDraft(meta.draft, name || id);
  const portraitFile = readZipPath(meta.portraitFile, "portrait file");
  const friendsSceneFile =
    meta.friendsSceneFile == null ? null : readZipPath(meta.friendsSceneFile, "friends scene file");
  const portraitUrl = await dataUrlFromZip(zip, portraitFile);
  const friendsSceneUrl = friendsSceneFile ? await dataUrlFromZip(zip, friendsSceneFile) : null;
  return {
    id,
    createdAt,
    updatedAt,
    name: name || draft.name || "Friend",
    draft,
    portraitUrl,
    friendsSceneUrl,
  };
}

async function dataUrlFromZip(zip: JSZip, path: string) {
  const entry = zip.file(path);
  if (!entry) throw new Error(`The zip is missing ${path}.`);
  const bytes = await entry.async("uint8array");
  if (!bytes.byteLength) throw new Error(`The image ${path} is empty.`);
  const mediaType = extensionFor(path) ? mediaTypeForPath(path) : sniffMediaType(bytes);
  if (!mediaType || !extensionFor(mediaType)) {
    throw new Error(`The image ${path} is not a PNG, JPEG, WebP, or GIF.`);
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mediaType });
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read an image from the zip."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read an image from the zip."));
    reader.readAsDataURL(blob);
  });
}

function readDraft(value: unknown, label: string): CardDraft {
  if (!value || typeof value !== "object") {
    throw new Error(`“${label}” is missing its card details.`);
  }
  const raw = value as Record<string, unknown>;
  const paletteId = raw.paletteId;
  if (typeof paletteId !== "string" || !PALETTES.has(paletteId as PaletteId)) {
    throw new Error(`“${label}” has an unknown palette.`);
  }
  return {
    name: readString(raw.name, "name", label),
    hp: readNumber(raw.hp, label, "HP"),
    typeLabel: readString(raw.typeLabel, "type", label),
    caption: readString(raw.caption, "caption", label),
    attack1Name: readString(raw.attack1Name, "attack", label),
    attack1Damage: readNumber(raw.attack1Damage, label, "attack damage"),
    attack1Text: readString(raw.attack1Text, "attack text", label),
    attack1Custom: raw.attack1Custom === true ? true : undefined,
    attack2Name: readString(raw.attack2Name, "attack", label),
    attack2Damage: readNumber(raw.attack2Damage, label, "attack damage"),
    attack2Text: readString(raw.attack2Text, "attack text", label),
    attack2Custom: raw.attack2Custom === true ? true : undefined,
    weakness: readString(raw.weakness, "weakness", label),
    special: raw.special === "gold" || raw.special === "rainbow" ? raw.special : undefined,
    resistance: readString(raw.resistance, "resistance", label),
    retreat: readNumber(raw.retreat, label, "retreat"),
    flavor: readString(raw.flavor, "flavor", label),
    cardNo: readString(raw.cardNo, "card number", label),
    paletteId: paletteId as PaletteId,
  };
}

function readId(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    throw new Error("A card in this zip has a missing or invalid id.");
  }
  return value;
}

function readZipPath(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`A card is missing its ${label}.`);
  }
  const path = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (path.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`A card has an invalid ${label}.`);
  }
  return path;
}

function readString(value: unknown, field: string, label?: string) {
  if (typeof value !== "string") {
    throw new Error(
      label ? `“${label}” is missing its ${field}.` : `A card is missing its ${field}.`,
    );
  }
  return value;
}

function readNumber(value: unknown, label: string, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`“${label}” has an invalid ${field}.`);
  }
  return value;
}

function sniffMediaType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  return "";
}

function extensionFor(mediaTypeOrPath: string) {
  const value = mediaTypeOrPath.split(";")[0]?.trim().toLowerCase() ?? "";
  if (value === "image/png" || value.endsWith(".png")) return "png";
  if (value === "image/jpeg" || value === "image/jpg" || value.endsWith(".jpg") || value.endsWith(".jpeg")) {
    return "jpg";
  }
  if (value === "image/webp" || value.endsWith(".webp")) return "webp";
  if (value === "image/gif" || value.endsWith(".gif")) return "gif";
  return null;
}

function mediaTypeForPath(path: string) {
  const ext = extensionFor(path);
  if (ext === "png") return "image/png";
  if (ext === "jpg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "";
}
