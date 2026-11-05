"use client";

type Props = {
  artUrl: string;
  className?: string;
};

/**
 * Art-frame portrait. Framing CSS lives on `.card-art-image` so baked art,
 * Gemini results, and photo previews share the same face-safe crop.
 */
export function CharacterStage({ artUrl, className }: Props) {
  return (
    <div
      className={`card-art-stage relative h-full w-full overflow-hidden bg-[#87CEEB] ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artUrl}
        alt="Card art"
        className="card-art-image h-full w-full"
        draggable={false}
      />
    </div>
  );
}
