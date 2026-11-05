"use client";

import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";

type Props = {
  data: CardData;
};

/** 2-up front + back with crop marks, matching the reference sheet layout. */
export function PrintSheet({ data }: Props) {
  return (
    <div
      className="print-sheet relative mx-auto w-full max-w-[1100px] bg-[#f7f4ef] p-8"
      style={{
        backgroundImage:
          "radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      <CropMarks />
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        <div className="relative mx-auto w-full max-w-[360px]">
          <CardFront data={data} />
        </div>
        <div className="relative mx-auto w-full max-w-[360px]">
          <CardBack theme={data.theme} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-px -translate-x-1/2 border-l border-dashed border-black/40 md:block" />
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
