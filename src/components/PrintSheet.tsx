"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { isCloudAssetUrl } from "@/lib/cardLibrary";

/** On-screen pair is laid out at this width, then scaled to fit the phone. */
const PAIR_BOARD_PX = 760;

export type PrintPairKind = "dana" | "name";

type Props = {
  data: CardData;
  /**
   * Personalized friends-party scene for the {name} & Friends back only.
   * Dana & Friends always keeps the stock brand background art.
   */
  friendsSceneUrl?: string | null;
  /** Card name for the name pair. */
  cardName?: string;
  /** Which 2-up pair to render. */
  pair?: PrintPairKind;
  /**
   * Fixed A4 sheet: each card is the real sleeve size (63.5 × 88.9 mm).
   * Used for save / print / PDF after generation.
   */
  exportLayout?: boolean;
};

/**
 * One 2-up print pair: front | back, pure white page, dashed fold line only.
 */
export function PrintSheet({
  data,
  friendsSceneUrl,
  cardName,
  pair = "dana",
  exportLayout = false,
}: Props) {
  const name = (cardName || data.customName || "FRIEND").trim() || "FRIEND";
  const isDana = pair === "dana";
  const backTitle = isDana ? "Dana & Friends" : `${name} & Friends`;
  const backFooter = isDana
    ? "Dana’s Special Card • 2026"
    : `${name.toUpperCase()}'S SPECIAL CARD • 2026`;
  const pairLabel = isDana ? "Dana & Friends pair" : `${name} & Friends pair`;
  // Brand Dana back = stock art. Name back uses a scene stored on the card.
  // A library or Blob URL is not fetched — those reads 500 while Blob quota is exhausted.
  const localScene =
    friendsSceneUrl && !isCloudAssetUrl(friendsSceneUrl) ? friendsSceneUrl : null;
  const backSceneUrl = isDana ? null : localScene;

  const cards = (
    <>
      <div
        className="relative mx-auto min-w-0"
        style={
          exportLayout
            ? { width: "63.5mm", backgroundColor: "#FFFFFF" }
            : { width: "100%", backgroundColor: "#FFFFFF" }
        }
      >
        <p
          className={
            exportLayout
              ? "mb-[2mm] text-center text-[8pt] font-bold uppercase tracking-wider text-black/45"
              : "mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45"
          }
        >
          Front
        </p>
        <CardFront data={data} />
      </div>
      <div
        className="relative mx-auto min-w-0"
        style={
          exportLayout
            ? { width: "63.5mm", backgroundColor: "#FFFFFF" }
            : { width: "100%", backgroundColor: "#FFFFFF" }
        }
      >
        <p
          className={
            exportLayout
              ? "mb-[2mm] text-center text-[8pt] font-bold uppercase tracking-wider text-black/45"
              : "mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45"
          }
        >
          Back — {backTitle}
        </p>
        <CardBack
          theme={data.theme}
          title={backTitle}
          footer={backFooter}
          sceneUrl={backSceneUrl}
        />
      </div>
    </>
  );

  return (
    <div
      className={
        exportLayout
          ? "print-sheet relative bg-white"
          : "print-sheet relative mx-auto w-full max-w-[1100px] p-3 sm:p-8"
      }
      style={
        exportLayout
          ? {
              width: "210mm",
              padding: "12mm 10mm 14mm",
              backgroundColor: "#FFFFFF",
              backgroundImage: "none",
            }
          : { backgroundColor: "#FFFFFF", backgroundImage: "none" }
      }
      data-pair={pair}
      data-page-bg="#FFFFFF"
      data-export-layout={exportLayout ? "1" : undefined}
    >
      <CropMarks />
      <p
        className="text-center font-bold uppercase tracking-[0.18em] text-black/45"
        style={
          exportLayout
            ? { marginBottom: "4mm", fontSize: "9pt" }
            : undefined
        }
      >
        <span className={exportLayout ? undefined : "mb-1 block text-[11px]"}>
          {pairLabel}
        </span>
      </p>
      {exportLayout ? (
        <div className="relative">
          <div
            className="relative mx-auto grid grid-cols-2"
            style={{ width: "141mm", gap: "14mm", backgroundColor: "#FFFFFF" }}
          >
            {cards}
          </div>
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 top-6 w-0 -translate-x-1/2 border-l-2 border-dashed border-black/55"
            aria-hidden
          />
        </div>
      ) : (
        <FittedPair>
          <div
            className="relative grid grid-cols-2"
            style={{ width: PAIR_BOARD_PX, gap: 40, backgroundColor: "#FFFFFF" }}
          >
            {cards}
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 top-6 w-0 -translate-x-1/2 border-l-2 border-dashed border-black/55"
              aria-hidden
            />
          </div>
        </FittedPair>
      )}
    </div>
  );
}

/**
 * Lays the pair out at PAIR_BOARD_PX so card text stays intact, then scales
 * the whole board to the viewport. A fluid two-column squeeze wraps names
 * into the HP badge.
 */
function FittedPair({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    const board = boardRef.current;
    if (!frame || !board) return;
    const measure = () => {
      const naturalW = board.offsetWidth || PAIR_BOARD_PX;
      const avail = frame.clientWidth || naturalW;
      const scale = Math.min(1, avail / naturalW);
      setBox({ scale, height: Math.ceil(board.offsetHeight * scale) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative mt-3 w-full"
      style={{ height: box.height || undefined }}
      data-pair-fit="1"
    >
      <div
        ref={boardRef}
        className="absolute left-1/2 top-0"
        style={{
          width: PAIR_BOARD_PX,
          transform: `translateX(-50%) scale(${box.scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
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
      <span className="pointer-events-none absolute bottom-3 left-1/2 h-3 w-px -translate-x-1/2 bg-black" />
      <span className="pointer-events-none absolute left-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
      <span className="pointer-events-none absolute right-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
    </>
  );
}
