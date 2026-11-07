import { del, get, list, put, BlobNotFoundError } from "@vercel/blob";
import type { CardDraft, PaletteId } from "@/lib/cardModel";
import type { SavedCard } from "@/lib/cardLibrary";

const PALETTES = new Set<PaletteId>(["electric", "autumn", "aura", "sparkle"]);

type StoredCard = {
  id: string;
  createdAt: number;
  updatedAt?: number;
  name: string;
  draft: CardDraft;
  hasFriendsScene: boolean;
};

export class CardStorageError extends Error {
  status: number;
  configured: boolean;

  constructor(message: string, status = 400, configured = true) {
    super(message);
    this.status = status;
    this.configured = configured;
  }
}

export function blobConfigured() {
  return Boolean(process.env.BLOB_STORE_ID);
}

export async function listCloudCards(): Promise<SavedCard[]> {
  assertConfigured();
  const cards: SavedCard[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "cards/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith("/card.json")) continue;
      const stored = await readStored(blob.pathname);
      if (stored) cards.push(toClientCard(stored));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  cards.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
  return cards;
}

export async function readCloudCard(id: string): Promise<SavedCard | null> {
  assertConfigured();
  const stored = await readStored(jsonPath(assertId(id)));
  return stored ? toClientCard(stored) : null;
}

export async function saveCloudCard(input: {
  id: string;
  createdAt: number;
  updatedAt?: number;
  name: string;
  draft: unknown;
  portrait: Blob;
  scene: Blob | null;
}): Promise<SavedCard> {
  assertConfigured();
  const id = assertId(input.id);
  const draft = readDraft(input.draft, input.name || id);
  const createdAt = readTime(input.createdAt, "created time");
  const updatedAt =
    input.updatedAt == null ? undefined : readTime(input.updatedAt, "updated time");
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : draft.name || "Friend";
  if (!input.portrait.size) throw new CardStorageError("The portrait image is empty.");
  const portraitType = await mediaTypeOf(input.portrait, "portrait");
  const sceneType = input.scene && input.scene.size ? await mediaTypeOf(input.scene, "friends scene") : null;

  await putPrivate(portraitPath(id), input.portrait, portraitType);
  if (input.scene && sceneType) {
    await putPrivate(scenePath(id), input.scene, sceneType);
  } else {
    await deleteIfPresent(scenePath(id));
  }

  const stored: StoredCard = {
    id,
    createdAt,
    updatedAt,
    name,
    draft,
    hasFriendsScene: Boolean(sceneType),
  };
  await putPrivate(jsonPath(id), JSON.stringify(stored), "application/json");
  return toClientCard(stored);
}

/** Rewrite card details only. Portrait and scene blobs stay as they are. */
export async function updateCloudCardDraft(
  id: string,
  draft: CardDraft,
): Promise<SavedCard | null> {
  assertConfigured();
  const safe = assertId(id);
  const stored = await readStored(jsonPath(safe));
  if (!stored) return null;
  const next: StoredCard = {
    ...stored,
    draft: readDraft(draft, stored.name || safe),
    updatedAt: Date.now(),
  };
  await putPrivate(jsonPath(safe), JSON.stringify(next), "application/json");
  return toClientCard(next);
}

export async function deleteCloudCard(id: string): Promise<void> {
  assertConfigured();
  const safe = assertId(id);
  await deleteIfPresent(jsonPath(safe));
  await deleteIfPresent(portraitPath(safe));
  await deleteIfPresent(scenePath(safe));
}

export async function openCardAsset(id: string, asset: string) {
  assertConfigured();
  if (asset !== "portrait" && asset !== "scene") {
    throw new CardStorageError("Unknown card file.");
  }
  const safe = assertId(id);
  const stored = await readStored(jsonPath(safe));
  if (!stored) return null;
  if (asset === "scene" && !stored.hasFriendsScene) return null;
  const result = await get(asset === "portrait" ? portraitPath(safe) : scenePath(safe), {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200) return null;
  return result;
}

function assertConfigured() {
  if (!blobConfigured()) {
    throw new CardStorageError("Card storage is not configured.", 503, false);
  }
}

function assertId(id: string) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    throw new CardStorageError("That card id is not valid.");
  }
  return id;
}

function jsonPath(id: string) {
  return `cards/${id}/card.json`;
}

function portraitPath(id: string) {
  return `cards/${id}/portrait`;
}

function scenePath(id: string) {
  return `cards/${id}/scene`;
}

function toClientCard(card: StoredCard): SavedCard {
  const version = card.updatedAt ?? card.createdAt;
  return {
    id: card.id,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    name: card.name,
    draft: card.draft,
    portraitUrl: `/api/library/${card.id}/portrait?v=${version}`,
    friendsSceneUrl: card.hasFriendsScene ? `/api/library/${card.id}/scene?v=${version}` : null,
  };
}

async function putPrivate(pathname: string, body: Blob | string, contentType: string) {
  await put(pathname, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 60,
  });
}

async function deleteIfPresent(pathname: string) {
  try {
    await del(pathname);
  } catch (err) {
    if (err instanceof BlobNotFoundError) return;
    throw err;
  }
}

async function readStored(pathname: string): Promise<StoredCard | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await new Response(result.stream).text());
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const raw = parsed as Record<string, unknown>;
  if (typeof raw.id !== "string") return null;
  try {
    return {
      id: assertId(raw.id),
      createdAt: readTime(raw.createdAt, "created time"),
      updatedAt: raw.updatedAt == null ? undefined : readTime(raw.updatedAt, "updated time"),
      name: typeof raw.name === "string" ? raw.name : "Friend",
      draft: readDraft(raw.draft, typeof raw.name === "string" ? raw.name : raw.id),
      hasFriendsScene: raw.hasFriendsScene === true,
    };
  } catch {
    return null;
  }
}

async function mediaTypeOf(file: Blob, label: string) {
  const declared = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (isImageType(declared)) return declared === "image/jpg" ? "image/jpeg" : declared;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const sniffed = sniffMediaType(bytes);
  if (!sniffed) {
    throw new CardStorageError(`The ${label} is not a PNG, JPEG, WebP, or GIF.`);
  }
  return sniffed;
}

function sniffMediaType(bytes: Uint8Array) {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
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
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  return "";
}

function isImageType(value: string) {
  return value === "image/png" || value === "image/jpeg" || value === "image/jpg" || value === "image/webp" || value === "image/gif";
}

function readDraft(value: unknown, label: string): CardDraft {
  if (!value || typeof value !== "object") {
    throw new CardStorageError(`“${label}” is missing its card details.`);
  }
  const raw = value as Record<string, unknown>;
  const paletteId = raw.paletteId;
  if (typeof paletteId !== "string" || !PALETTES.has(paletteId as PaletteId)) {
    throw new CardStorageError(`“${label}” has an unknown palette.`);
  }
  return {
    name: readString(raw.name, label, "name"),
    hp: readNumber(raw.hp, label, "HP"),
    typeLabel: readString(raw.typeLabel, label, "type"),
    caption: readString(raw.caption, label, "caption"),
    attack1Name: readString(raw.attack1Name, label, "attack"),
    attack1Damage: readNumber(raw.attack1Damage, label, "attack damage"),
    attack1Text: readString(raw.attack1Text, label, "attack text"),
    attack1Custom: raw.attack1Custom === true ? true : undefined,
    attack2Name: readString(raw.attack2Name, label, "attack"),
    attack2Damage: readNumber(raw.attack2Damage, label, "attack damage"),
    attack2Text: readString(raw.attack2Text, label, "attack text"),
    attack2Custom: raw.attack2Custom === true ? true : undefined,
    weakness: readString(raw.weakness, label, "weakness"),
    special: raw.special === "gold" || raw.special === "rainbow" ? raw.special : undefined,
    resistance: readString(raw.resistance, label, "resistance"),
    retreat: readNumber(raw.retreat, label, "retreat"),
    flavor: readString(raw.flavor, label, "flavor"),
    cardNo: readString(raw.cardNo, label, "card number"),
    paletteId: paletteId as PaletteId,
  };
}

function readString(value: unknown, label: string, field: string) {
  if (typeof value !== "string") {
    throw new CardStorageError(`“${label}” is missing its ${field}.`);
  }
  return value;
}

function readNumber(value: unknown, label: string, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CardStorageError(`“${label}” has an invalid ${field}.`);
  }
  return value;
}

function readTime(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CardStorageError(`A card has an invalid ${field}.`);
  }
  return value;
}
