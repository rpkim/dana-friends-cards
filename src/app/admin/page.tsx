"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import {
  deleteSavedCard,
  formatCardNo,
  listSavedCards,
  reorderSavedCards,
  setSavedCardTreatment,
  type CardTreatment,
  type SavedCard,
} from "@/lib/cardLibrary";
import { buildCardsZip, downloadCardsZip, importCardsZip } from "@/lib/cardZip";
import { themeFromDraft } from "@/lib/cardModel";

const PAGE_SIZE = 9;

/**
 * Long-edge flip swaps left and right and keeps the row.
 * Front slots 1 2 3 / 4 5 6 / 7 8 9 print on the back as 3 2 1 / 6 5 4 / 9 8 7.
 */
function mirrorColumns<T>(slots: readonly (T | null)[]): (T | null)[] {
  const mirrored: (T | null)[] = [];
  for (let row = 0; row < 3; row += 1) {
    const start = row * 3;
    mirrored.push(slots[start + 2] ?? null, slots[start + 1] ?? null, slots[start] ?? null);
  }
  return mirrored;
}

function paginate<T>(items: readonly T[]): (T | null)[][] {
  if (items.length === 0) return [];
  const pages: (T | null)[][] = [];
  for (let index = 0; index < items.length; index += PAGE_SIZE) {
    const page: (T | null)[] = items.slice(index, index + PAGE_SIZE);
    while (page.length < PAGE_SIZE) page.push(null);
    pages.push(page);
  }
  return pages;
}

function toCardData(card: SavedCard): CardData {
  return {
    theme: themeFromDraft(card.draft),
    artUrl: card.portraitUrl,
    customName: card.draft.name || card.name,
    customHp: card.draft.hp,
  };
}

type DropPlace = "before" | "after";

function moveInOrder(
  ids: readonly string[],
  fromId: string,
  toId: string,
  place: DropPlace,
): string[] {
  if (fromId === toId) return [...ids];
  const without = ids.filter((id) => id !== fromId);
  const index = without.indexOf(toId);
  if (index < 0) return [...ids];
  const next = [...without];
  next.splice(place === "after" ? index + 1 : index, 0, fromId);
  return next;
}

function treatmentOf(card: SavedCard): CardTreatment {
  return card.draft.special === "gold" || card.draft.special === "rainbow"
    ? card.draft.special
    : "standard";
}

function formatSavedAt(createdAt: number) {
  return new Date(createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminPrintPage() {
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipNote, setZipNote] = useState<{ error: boolean; text: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteNote, setDeleteNote] = useState<{ error: boolean; text: string } | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [orderNote, setOrderNote] = useState<{ error: boolean; text: string } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ id: string; place: DropPlace } | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Print cards · Dana & Friends";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSavedCards()
      .then((rows) => {
        if (cancelled) return;
        setCards(rows);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCards([]);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCards = useMemo(
    () =>
      selectedIds.flatMap((id) => {
        const card = cards?.find((row) => row.id === id);
        return card ? [card] : [];
      }),
    [cards, selectedIds],
  );

  const frontPages = useMemo(() => paginate(selectedCards), [selectedCards]);

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
    );
  }

  async function reloadCards() {
    const rows = await listSavedCards();
    setCards(rows);
    setLoadError(false);
    return rows;
  }

  async function onDownloadZip() {
    if (selectedCards.length === 0) {
      setZipNote({ error: false, text: "Select at least one card to download." });
      return;
    }
    setZipBusy(true);
    setZipNote(null);
    try {
      const { blob, warnings } = await buildCardsZip(selectedCards);
      downloadCardsZip(blob);
      const count = selectedCards.length;
      const downloaded = `Downloaded dana-cards.zip (${count} ${count === 1 ? "card" : "cards"}).`;
      setZipNote({
        error: warnings.length > 0,
        text: warnings.length > 0 ? `${downloaded} ${warnings.join(" ")}` : downloaded,
      });
    } catch (err) {
      setZipNote({
        error: true,
        text: err instanceof Error ? err.message : "Could not download the zip.",
      });
    } finally {
      setZipBusy(false);
    }
  }

  async function onImportZip(file: File | undefined) {
    if (!file) return;
    setZipBusy(true);
    setZipNote(null);
    try {
      const imported = await importCardsZip(file);
      await reloadCards();
      const count = imported.length;
      setZipNote({
        error: false,
        text: `Imported ${count} ${count === 1 ? "card" : "cards"}.`,
      });
    } catch (err) {
      try {
        const rows = await listSavedCards();
        setCards(rows);
        setLoadError(false);
      } catch {
        /* keep the list already on screen */
      }
      setZipNote({
        error: true,
        text: err instanceof Error ? err.message : "Could not import the zip.",
      });
    } finally {
      setZipBusy(false);
    }
  }

  function dropCards(ids: readonly string[]) {
    const gone = new Set(ids);
    setCards((current) => current?.filter((card) => !gone.has(card.id)) ?? current);
    setSelectedIds((current) => current.filter((id) => !gone.has(id)));
  }

  async function onDeleteSelected() {
    if (selectedCards.length === 0 || deleteBusy) return;
    const targets = selectedCards.map((card) => card.id);
    const count = targets.length;
    const noun = count === 1 ? "card" : "cards";
    const confirmed = window.confirm(
      `Delete ${count} selected ${noun} from this browser? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteBusy(true);
    setDeleteNote(null);
    const removed: string[] = [];
    try {
      for (const id of targets) {
        await deleteSavedCard(id);
        removed.push(id);
      }
      dropCards(removed);
      try {
        await reloadCards();
      } catch {
        /* the deleted cards are already removed from the list on screen */
      }
      setDeleteNote({ error: false, text: `Deleted ${count} ${noun}.` });
    } catch (err) {
      if (removed.length > 0) dropCards(removed);
      try {
        await reloadCards();
      } catch {
        /* keep the list already on screen */
      }
      setDeleteNote({
        error: true,
        text: err instanceof Error ? err.message : "Could not delete the selected cards.",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  async function commitOrder(fromId: string, toId: string, place: DropPlace) {
    if (!cards || libraryBusy || fromId === toId) return;
    const currentIds = cards.map((card) => card.id);
    const nextIds = moveInOrder(currentIds, fromId, toId, place);
    if (nextIds.every((id, index) => id === currentIds[index])) return;
    const byId = new Map(cards.map((card) => [card.id, card]));
    const previous = cards;
    setCards(
      nextIds.map((id, index) => {
        const card = byId.get(id);
        if (!card) return null;
        const cardNo = formatCardNo(index + 1);
        return card.draft.cardNo === cardNo ? card : { ...card, draft: { ...card.draft, cardNo } };
      }).filter((card): card is SavedCard => card !== null),
    );
    setLibraryBusy(true);
    setOrderNote(null);
    try {
      const rows = await reorderSavedCards(nextIds);
      setCards(rows);
      setLoadError(false);
    } catch (err) {
      setCards(previous);
      setOrderNote({
        error: true,
        text: err instanceof Error ? err.message : "Could not save the new order.",
      });
    } finally {
      setLibraryBusy(false);
    }
  }

  async function onTreatment(id: string, treatment: CardTreatment) {
    const card = cards?.find((row) => row.id === id);
    if (!card || libraryBusy || treatmentOf(card) === treatment) return;
    setLibraryBusy(true);
    setOrderNote(null);
    try {
      const updated = await setSavedCardTreatment(id, treatment);
      if (!updated) {
        setOrderNote({ error: true, text: "That card is no longer in the library." });
        return;
      }
      setCards((current) => current?.map((row) => (row.id === id ? updated : row)) ?? current);
    } catch (err) {
      setOrderNote({
        error: true,
        text: err instanceof Error ? err.message : "Could not update that card.",
      });
    } finally {
      setLibraryBusy(false);
    }
  }

  function onDragStart(event: DragEvent<HTMLLIElement>, id: string) {
    const target = event.target;
    if (target instanceof Element && target.closest("button, input, a")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDragId(id);
  }

  function onDragOver(event: DragEvent<HTMLLIElement>, id: string) {
    if (!dragId || libraryBusy) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const place: DropPlace = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropHint((current) => (current?.id === id && current.place === place ? current : { id, place }));
  }

  function onDrop(event: DragEvent<HTMLLIElement>, targetId: string) {
    event.preventDefault();
    const fromId = event.dataTransfer.getData("text/plain") || dragId;
    const place = dropHint?.id === targetId ? dropHint.place : "before";
    setDragId(null);
    setDropHint(null);
    if (!fromId) return;
    void commitOrder(fromId, targetId, place);
  }

  function selectAll() {
    if (!cards) return;
    setSelectedIds((current) => {
      const seen = new Set(current);
      const next = [...current];
      for (const card of cards) {
        if (!seen.has(card.id)) next.push(card.id);
      }
      return next;
    });
  }

  const sheetPairs = frontPages.length;

  return (
    <main className="admin-root">
      <div className="admin-chrome mx-auto w-full max-w-3xl px-4 pb-6 pt-6">
        <div className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-sm md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-black/45">
            Dana &amp; Friends
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-4xl font-bold leading-none">Print cards</h1>
            <a href="/" className="text-sm font-extrabold underline">
              Back to studio
            </a>
          </div>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-black/70">
            Choose cards saved in this browser. Each A4 page holds 9 sleeves at
            63.5 × 88.9 mm. In the print dialog, choose 100% / actual size.
          </p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-black/70">
            Print the front page, flip the paper on the long edge, then print
            the matching back. Drag a card to set its place. Card No. is that
            place out of 100, like 001/100. Checking cards still sets the print
            sheet order, left to right, top to bottom. Select all follows this list.
          </p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-black/70">
            Download zip saves the selected portraits, card details, and friends
            scenes. Import zip puts those cards back into the library.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={!cards || cards.length === 0}
              className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void onDeleteSelected()}
              disabled={deleteBusy || zipBusy || selectedCards.length === 0}
              data-admin-delete="selected"
              className="rounded-full border border-red-900/20 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-red-900 disabled:opacity-40"
            >
              {deleteBusy ? "Deleting…" : "Delete selected"}
            </button>
            <span className="text-xs font-bold text-black/50">
              {selectedCards.length} selected
              {sheetPairs > 0
                ? ` · ${sheetPairs} sheet ${sheetPairs === 1 ? "pair" : "pairs"}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => void onDownloadZip()}
              disabled={zipBusy || cards === null}
              data-admin-zip="download"
              className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-40"
            >
              Download zip
            </button>
            <label
              className={`rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                zipBusy || cards === null ? "pointer-events-none opacity-40" : "cursor-pointer"
              }`}
            >
              Import zip
              <input
                type="file"
                accept=".zip,application/zip"
                disabled={zipBusy || cards === null}
                data-admin-zip="import"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void onImportZip(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={selectedCards.length === 0}
              data-admin-print="1"
              className="ml-auto rounded-full bg-black px-4 py-2 text-sm font-extrabold text-[#FFE56A] disabled:opacity-40"
            >
              Print sheets
            </button>
          </div>
          {zipNote ? (
            <p
              className={`mt-3 text-sm font-semibold ${zipNote.error ? "text-red-800" : "text-black/70"}`}
              data-zip-message="1"
              role="status"
            >
              {zipNote.text}
            </p>
          ) : null}
          {deleteNote ? (
            <p
              className={`mt-3 text-sm font-semibold ${deleteNote.error ? "text-red-800" : "text-black/70"}`}
              data-delete-message="1"
              role="status"
            >
              {deleteNote.text}
            </p>
          ) : null}
          {orderNote ? (
            <p
              className={`mt-3 text-sm font-semibold ${orderNote.error ? "text-red-800" : "text-black/70"}`}
              data-order-message="1"
              role="status"
            >
              {orderNote.text}
            </p>
          ) : null}

          <div className="mt-5">
            {cards === null ? (
              <p className="text-sm font-semibold text-black/50">Loading saved cards…</p>
            ) : loadError ? (
              <p className="text-sm font-semibold text-black/70">
                This browser’s card library could not be read.
              </p>
            ) : cards.length === 0 ? (
              <p className="text-sm font-semibold text-black/70">
                Cards appear here after Save image in the studio.
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Saved cards" data-admin-order="1">
                {cards.map((card) => {
                  const order = selectedIds.indexOf(card.id);
                  const checked = order >= 0;
                  const treatment = treatmentOf(card);
                  const showBefore = dropHint?.id === card.id && dropHint.place === "before";
                  const showAfter = dropHint?.id === card.id && dropHint.place === "after";
                  return (
                    <li
                      key={card.id}
                      draggable={!libraryBusy}
                      data-card-id={card.id}
                      data-card-no={card.draft.cardNo}
                      data-card-treatment={treatment}
                      aria-grabbed={dragId === card.id}
                      onDragStart={(event) => onDragStart(event, card.id)}
                      onDragOver={(event) => onDragOver(event, card.id)}
                      onDrop={(event) => onDrop(event, card.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropHint(null);
                      }}
                      className={`rounded-2xl border border-black/10 bg-white ${
                        dragId === card.id ? "opacity-60" : ""
                      }`}
                    >
                      {showBefore ? (
                        <span className="admin-drop-line" data-drop-indicator="before" />
                      ) : null}
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span
                          className="cursor-grab select-none text-sm font-black leading-none text-black/35"
                          aria-hidden="true"
                        >
                          ⋮⋮
                        </span>
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(card.id)}
                            className="h-4 w-4 accent-black"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.portraitUrl}
                            alt=""
                            draggable={false}
                            className="h-14 w-10 shrink-0 rounded-md bg-black/5 object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold">
                              {card.name}
                            </span>
                            <span className="block text-xs font-semibold tabular-nums text-black/55">
                              {card.draft.cardNo}
                            </span>
                            <span className="block text-xs font-semibold text-black/45">
                              {formatSavedAt(card.createdAt)}
                            </span>
                          </span>
                        </label>
                        {checked ? (
                          <span className="shrink-0 rounded-full bg-black px-2 py-1 text-[11px] font-extrabold text-[#FFE56A]">
                            #{order + 1}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                        {(
                          [
                            ["standard", "Standard"],
                            ["gold", "Gold"],
                            ["rainbow", "Rainbow"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            disabled={libraryBusy}
                            aria-pressed={treatment === value}
                            data-treatment={value}
                            onClick={() => void onTreatment(card.id, value)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-40 ${
                              treatment === value
                                ? "border-black bg-black text-[#FFE56A]"
                                : "border-black/15 bg-white"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {showAfter ? (
                        <span className="admin-drop-line" data-drop-indicator="after" />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {selectedCards.length > 0 ? (
          <p className="mt-6 text-center text-xs font-extrabold uppercase tracking-[0.16em] text-black/45">
            Preview · front, then mirrored back
          </p>
        ) : null}
      </div>

      {frontPages.length > 0 ? (
        <div className="admin-sheets">
          {frontPages.map((slots, pageIndex) => (
            <SheetPair
              key={`pair-${pageIndex}-${slots.map((slot) => slot?.id ?? "empty").join("-")}`}
              slots={slots}
              pageIndex={pageIndex}
              pageCount={frontPages.length}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}

function SheetPair({
  slots,
  pageIndex,
  pageCount,
}: {
  slots: (SavedCard | null)[];
  pageIndex: number;
  pageCount: number;
}) {
  return (
    <>
      <AdminSheet
        side="front"
        slots={slots}
        pageIndex={pageIndex}
        pageCount={pageCount}
      />
      <AdminSheet
        side="back"
        slots={mirrorColumns(slots)}
        pageIndex={pageIndex}
        pageCount={pageCount}
      />
    </>
  );
}

function AdminSheet({
  side,
  slots,
  pageIndex,
  pageCount,
}: {
  side: "front" | "back";
  slots: (SavedCard | null)[];
  pageIndex: number;
  pageCount: number;
}) {
  const label =
    side === "front"
      ? "Fronts — print first"
      : "Backs — flip on the long edge, then print";
  const sheetNo = pageCount > 1 ? ` · ${pageIndex + 1} of ${pageCount}` : "";

  return (
    <section
      className="admin-sheet"
      data-export-layout="1"
      data-admin-sheet={side}
      data-sheet-index={pageIndex + 1}
      data-sheet-count={pageCount}
      aria-label={`${label}${sheetNo}`}
    >
      <p className="admin-sheet-label">
        {label}
        {sheetNo}
      </p>
      <div className="admin-print-grid" data-admin-grid="1">
        {slots.map((card, visualIndex) => {
          const frontSlot =
            side === "back" ? Math.floor(visualIndex / 3) * 3 + (2 - (visualIndex % 3)) : visualIndex;
          return (
            <div
              key={`${side}-${pageIndex}-${visualIndex}`}
              className="admin-print-slot"
              data-visual-slot={visualIndex}
              data-front-slot={frontSlot}
              data-card-id={card?.id ?? ""}
              data-card-name={card?.name ?? ""}
            >
              {card ? (
                side === "front" ? (
                  <CardFront data={toCardData(card)} />
                ) : (
                  <CardBack theme={themeFromDraft(card.draft)} />
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
