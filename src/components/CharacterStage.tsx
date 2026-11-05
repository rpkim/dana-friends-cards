"use client";

type Props = {
  artUrl: string;
  className?: string;
};

/** Frame art is always a painted anime/chibi image (Gemini or baked fallback). */
export function CharacterStage({ artUrl, className }: Props) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#87CEEB] ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artUrl}
        alt="Card art"
        className="h-full w-full object-cover object-top"
        draggable={false}
      />
    </div>
  );
}
