import type { CardDraft } from "@/lib/cardModel";

const DB_NAME = "dana-friends-cards";
const DB_VERSION = 2;
const STORE = "cards";
const ORDER_STORE = "libraryOrder";
const ORDER_KEY = "library";

/** Printed set size. Card No. is the place in the library order, out of this total. */
export const CARD_SET_TOTAL = 100;

export type CardTreatment = "standard" | "gold" | "rainbow";

type OrderRecord = { id: typeof ORDER_KEY; ids: string[] };

export type SavedCard = {
  id: string;
  createdAt: number;
  /** Set when a refine, generate, or save updates this same card. */
  updatedAt?: number;
  name: string;
  draft: CardDraft;
  portraitUrl: string;
  friendsSceneUrl: string | null;
};

/**
 * True when this URL is the library API or a Vercel Blob host.
 * Those reads fail while Blob quota is exhausted. Image bytes on the card
 * are data URLs or blob: URLs and are not cloud assets.
 */
export function isCloudAssetUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed, "http://local.invalid");
  } catch {
    return false;
  }
  const path = parsed.pathname;
  if (path === "/api/library" || path.startsWith("/api/library/")) return true;
  const host = parsed.hostname.toLowerCase();
  return host === "blob.vercel-storage.com" || host.endsWith(".blob.vercel-storage.com");
}

/** Place in the library order, zero-padded, out of a fixed set of 100. */
export function formatCardNo(position: number): string {
  const place = Math.max(1, Math.floor(position));
  return `${String(place).padStart(3, "0")}/${CARD_SET_TOTAL}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ORDER_STORE)) {
        db.createObjectStore(ORDER_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the card library."));
  });
}

/** Known order first. Cards saved before an order existed follow created time, oldest first. */
function arrangeCards(cards: readonly SavedCard[], ids: readonly string[]): SavedCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set<string>();
  const ordered: SavedCard[] = [];
  for (const id of ids) {
    const card = byId.get(id);
    if (!card || seen.has(id)) continue;
    seen.add(id);
    ordered.push(card);
  }
  const rest = cards
    .filter((card) => !seen.has(card.id))
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return [...ordered, ...rest];
}

function withCardNumbers(cards: readonly SavedCard[]): { cards: SavedCard[]; changed: SavedCard[] } {
  const changed: SavedCard[] = [];
  const next = cards.map((card, index) => {
    const cardNo = formatCardNo(index + 1);
    if (card.draft.cardNo === cardNo) return card;
    const updated: SavedCard = { ...card, draft: { ...card.draft, cardNo } };
    changed.push(updated);
    return updated;
  });
  return { cards: next, changed };
}

/** Studio saves keep the library number and foil. Admin treatment and reorder write those themselves. */
function keepLibraryIdentity(next: CardDraft, stored: CardDraft): CardDraft {
  const draft: CardDraft = { ...next, cardNo: stored.cardNo };
  if (stored.special === "gold" || stored.special === "rainbow") draft.special = stored.special;
  else delete draft.special;
  return draft;
}

function libraryError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

/**
 * Reads cards and the stored order, then writes inside the same success turn.
 * Awaiting between IndexedDB requests can commit the transaction first.
 */
function editLibrary(
  db: IDBDatabase,
  apply: (rows: SavedCard[], ids: readonly string[]) => {
    cards: SavedCard[];
    changed: SavedCard[];
    ids: string[];
    removeIds?: readonly string[];
  },
): Promise<SavedCard[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, ORDER_STORE], "readwrite");
    const cardStore = tx.objectStore(STORE);
    const orderStore = tx.objectStore(ORDER_STORE);
    const rowsReq = cardStore.getAll();
    const orderReq = orderStore.get(ORDER_KEY);
    let rows: SavedCard[] | undefined;
    let storedIds: string[] | undefined;
    let result: SavedCard[] | undefined;
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(libraryError(error, "Could not update the card library."));
    };
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
    tx.oncomplete = () => {
      if (settled) return;
      settled = true;
      if (result) resolve(result);
      else reject(new Error("Could not update the card library."));
    };
    rowsReq.onerror = () => fail(rowsReq.error);
    orderReq.onerror = () => fail(orderReq.error);
    const finish = () => {
      if (!rows || !storedIds || result) return;
      try {
        const next = apply(rows, storedIds);
        const orderChanged =
          storedIds.length !== next.ids.length ||
          storedIds.some((id, index) => id !== next.ids[index]);
        for (const removeId of next.removeIds ?? []) cardStore.delete(removeId);
        if (next.changed.length > 0 || orderChanged || (next.removeIds?.length ?? 0) > 0) {
          for (const card of next.changed) cardStore.put(card);
          const record: OrderRecord = { id: ORDER_KEY, ids: next.ids };
          orderStore.put(record);
        }
        result = next.cards;
      } catch (error) {
        fail(error);
      }
    };
    rowsReq.onsuccess = () => {
      rows = (rowsReq.result as SavedCard[]) ?? [];
      finish();
    };
    orderReq.onsuccess = () => {
      storedIds = ((orderReq.result as OrderRecord | undefined)?.ids) ?? [];
      finish();
    };
  });
}

/** Cards in the stored library order, with Card No. synced to that place out of 100. */
export async function listSavedCards(): Promise<SavedCard[]> {
  const db = await openDb();
  try {
    return await editLibrary(db, (rows, ids) => {
      const { cards, changed } = withCardNumbers(arrangeCards(rows, ids));
      return { cards, changed, ids: cards.map((card) => card.id) };
    });
  } finally {
    db.close();
  }
}

/** Replace the library order. Unknown ids are ignored. Missing cards stay at the end. */
export async function reorderSavedCards(orderedIds: readonly string[]): Promise<SavedCard[]> {
  const db = await openDb();
  try {
    return await editLibrary(db, (rows) => {
      const { cards, changed } = withCardNumbers(arrangeCards(rows, orderedIds));
      return { cards, changed, ids: cards.map((card) => card.id) };
    });
  } finally {
    db.close();
  }
}

/** Gold, rainbow, or the normal palette. The card number stays put. */
export async function setSavedCardTreatment(
  id: string,
  treatment: CardTreatment,
): Promise<SavedCard | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      let result: SavedCard | null = null;
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(libraryError(error, "Could not update the card."));
      };
      tx.onerror = () => fail(tx.error);
      tx.onabort = () => fail(tx.error);
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      getReq.onerror = () => fail(getReq.error);
      getReq.onsuccess = () => {
        const existing = getReq.result as SavedCard | undefined;
        if (!existing) return;
        const draft: CardDraft = { ...existing.draft };
        if (treatment === "standard") delete draft.special;
        else draft.special = treatment;
        result = { ...existing, draft, id, updatedAt: Date.now() };
        store.put(result);
      };
    });
  } finally {
    db.close();
  }
}

export async function saveCard(
  input: Omit<SavedCard, "id" | "createdAt">,
): Promise<SavedCard> {
  const db = await openDb();
  try {
    let saved: SavedCard | null = null;
    await editLibrary(db, (rows, ids) => {
      const { cards, changed } = withCardNumbers(arrangeCards(rows, ids));
      const entry: SavedCard = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        draft: { ...input.draft, cardNo: formatCardNo(cards.length + 1) },
      };
      saved = entry;
      return {
        cards: [...cards, entry],
        changed: [...changed, entry],
        ids: [...cards.map((card) => card.id), entry.id],
      };
    });
    if (!saved) throw new Error("Could not save the card.");
    return saved;
  } finally {
    db.close();
  }
}

/** Replace the portrait and card data on an existing library entry. */
export async function updateSavedCard(
  id: string,
  patch: Partial<Pick<SavedCard, "name" | "draft" | "portraitUrl" | "friendsSceneUrl">>,
): Promise<SavedCard | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      let result: SavedCard | null = null;
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(libraryError(error, "Could not update the card."));
      };
      tx.onerror = () => fail(tx.error);
      tx.onabort = () => fail(tx.error);
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      getReq.onerror = () => fail(getReq.error);
      getReq.onsuccess = () => {
        const existing = getReq.result as SavedCard | undefined;
        if (!existing) return;
        result = {
          ...existing,
          ...patch,
          draft: patch.draft ? keepLibraryIdentity(patch.draft, existing.draft) : existing.draft,
          id,
          updatedAt: Date.now(),
        };
        store.put(result);
      };
    });
  } finally {
    db.close();
  }
}

/** Insert or replace a card by its existing id. A zip import uses this so the same id updates one row. */
export async function upsertSavedCard(entry: SavedCard): Promise<SavedCard> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save the card."));
    });
  } finally {
    db.close();
  }
  return entry;
}

export async function deleteSavedCard(id: string): Promise<void> {
  const db = await openDb();
  try {
    await editLibrary(db, (rows, ids) => {
      const remaining = rows.filter((card) => card.id !== id);
      const { cards, changed } = withCardNumbers(
        arrangeCards(
          remaining,
          ids.filter((rowId) => rowId !== id),
        ),
      );
      return {
        cards,
        changed,
        ids: cards.map((card) => card.id),
        removeIds: [id],
      };
    });
  } finally {
    db.close();
  }
}
