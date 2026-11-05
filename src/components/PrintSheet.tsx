"use client";

import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";

type Props = {
  data: CardData;
  /** Stylized portrait / generated back art shared by both backs when available. */
  backArtUrl?: string | null;
  /** Optional separate art for the name back. */
  nameBackArtUrl?: string | null;
  /** Card name for "{name} & Friends" back. */
  cardName?: string;
};

/**
 * Print sheet: front + Dana & Friends back + Name & Friends back.
 * Pure white page; dashed fold line only (no scissors / no CUT OR FOLD text).
 */
export function PrintSheet({
  data,
  backArtUrl,
  nameBackArtUrl,
  cardName,
}: Props) {
  const name = (cardName || data.customName || "FRIEND").trim() || "FRIEND";
  const nameTitle = `${name} & Friends`;
  const nameFooter = `${name.toUpperCase()}'S SPECIAL CARD • 2026`;
  const danaArt = backArtUrl || null;
  const nameArt = nameBackArtUrl || backArtUrl || null;

  return (
    <div
      className="print-sheet relative mx-auto w-full max-w-[1200px] bg-white p-8"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <CropMarks />
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        <div className="relative mx-auto w-full max-w-[320px]">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45">
            Front
          </p>
          <CardFront data={data} />
        </div>
        <div className="relative mx-auto w-full max-w-[320px]">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45">
            Dana &amp; Friends
          </p>
          <CardBack
            theme={data.theme}
            title="Dana & Friends"
            footer="Dana’s Special Card • 2026"
            artUrl={danaArt}
          />
        </div>
        <div className="relative mx-auto w-full max-w-[320px]">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45">
            {nameTitle}
          </p>
          <CardBack
            theme={data.theme}
            title={nameTitle}
            footer={nameFooter}
            artUrl={nameArt}
          />
        </div>
      </div>
      {/* Dashed fold guides between columns (desktop) — no text, no scissors */}
      <div
        className="pointer-events-none absolute inset-y-12 left-[33.333%] hidden w-0 -translate-x-1/2 border-l-2 border-dashed border-black/55 md:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-12 left-[66.666%] hidden w-0 -translate-x-1/2 border-l-2 border-dashed border-black/55 md:block"
        aria-hidden
      />
    </div>
  );
}

/** Classic 2-up front + one back (used when a Gemini 2-card sheet is primary). */
export function PrintSheetTwoUp({
  data,
  backArtUrl,
  backTitle = "Dana & Friends",
  backFooter = "Dana’s Special Card • 2026",
}: {
  data: CardData;
  backArtUrl?: string | null;
  backTitle?: string;
  backFooter?: string;
}) {
  return (
    <div
      className="print-sheet relative mx-auto w-full max-w-[1100px] bg-white p-8"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <CropMarks />
      <div className="relative grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
        <div className="relative mx-auto w-full max-w-[360px]">
          <CardFront data={data} />
        </div>
        <div className="relative mx-auto w-full max-w-[360px]">
          <CardBack
            theme={data.theme}
            title={backTitle}
            footer={backFooter}
            artUrl={backArtUrl}
          />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-0 -translate-x-1/2 border-l-2 border-dashed border-black/55 md:block"
        aria-hidden
      />
    </div>
  );
}

function CropMarks() {
  const mark = (extra: string) => (
    <span
      className={`pointer-events-none absolute h-4 w-4 border-black ${extra}`}
      aria-hidden
    />
  );
  return (
    <>
      {mark("left-4 top-4 border-l-2 border-t-2")}
      {mark("right-4 top-4 border-r-2 border-t-2")}
      {mark("bottom-4 left-4 border-b-2 border-l-2")}
      {mark("bottom-4 right-4 border-b-2 border-r-2")}
      <span className="pointer-events-none absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-black" />
      <span className="pointer-events-none absolute bottom-3 left-1/2 h-3 w-px -translate-x-1/2 bg-black" />
      <span className="pointer-events-none absolute left-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
      <span className="pointer-events-none absolute right-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
    </>
  );
}
