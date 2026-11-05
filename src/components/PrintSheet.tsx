"use client";

import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";

export type PrintPairKind = "dana" | "name";

type Props = {
  data: CardData;
  /**
   * Stylized user portrait — on the front art frame and composited into the back.
   * Same face on Dana & Friends and {name} & Friends pairs.
   */
  faceUrl?: string | null;
  /**
   * Optional full Gemini scene for the name-back only (must already show the user).
   * Never a title-only stock swap.
   */
  nameBackSceneUrl?: string | null;
  /** Card name for the name pair. */
  cardName?: string;
  /** Which 2-up pair to render. */
  pair?: PrintPairKind;
};

/**
 * One 2-up print pair: front | back, pure white page, dashed fold line only.
 */
export function PrintSheet({
  data,
  faceUrl,
  nameBackSceneUrl,
  cardName,
  pair = "dana",
}: Props) {
  const name = (cardName || data.customName || "FRIEND").trim() || "FRIEND";
  const isDana = pair === "dana";
  const backTitle = isDana ? "Dana & Friends" : `${name} & Friends`;
  const backFooter = isDana
    ? "Dana’s Special Card • 2026"
    : `${name.toUpperCase()}'S SPECIAL CARD • 2026`;
  const pairLabel = isDana ? "Dana & Friends pair" : `${name} & Friends pair`;

  return (
    <div
      className="print-sheet relative mx-auto w-full max-w-[1100px] p-8"
      style={{ backgroundColor: "#FFFFFF", backgroundImage: "none" }}
      data-pair={pair}
      data-page-bg="#FFFFFF"
    >
      <CropMarks />
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-black/45">
        {pairLabel}
      </p>
      <div
        className="relative grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="relative mx-auto w-full max-w-[360px]"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45">
            Front
          </p>
          <CardFront data={data} />
        </div>
        <div
          className="relative mx-auto w-full max-w-[360px]"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-black/45">
            Back — {backTitle}
          </p>
          <CardBack
            theme={data.theme}
            title={backTitle}
            footer={backFooter}
            faceUrl={faceUrl}
            sceneUrl={
              !isDana && nameBackSceneUrl && faceUrl
                ? nameBackSceneUrl
                : null
            }
          />
        </div>
      </div>
      {/* Dashed fold line only — white gap, no scissors, no CUT OR FOLD text */}
      <div
        className="pointer-events-none absolute inset-y-14 left-1/2 hidden w-4 -translate-x-1/2 md:block"
        style={{ backgroundColor: "#FFFFFF" }}
        aria-hidden
      >
        <div className="mx-auto h-full w-0 border-l-2 border-dashed border-black/55" />
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
      <span className="pointer-events-none absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-black" />
      <span className="pointer-events-none absolute bottom-3 left-1/2 h-3 w-px -translate-x-1/2 bg-black" />
      <span className="pointer-events-none absolute left-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
      <span className="pointer-events-none absolute right-3 top-1/2 h-px w-3 -translate-y-1/2 bg-black" />
    </>
  );
}
