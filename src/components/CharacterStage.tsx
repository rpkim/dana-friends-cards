"use client";

import {
  PART_CATEGORIES,
  getPart,
  type PartsSelection,
} from "@/lib/parts";

type Props = {
  parts: PartsSelection;
  photoUrl?: string | null;
  className?: string;
};

export function CharacterStage({ parts, photoUrl, className }: Props) {
  if (photoUrl) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="Card art"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const layers = PART_CATEGORIES.map((c) => getPart(parts[c.id])).filter(
    Boolean,
  );

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <svg
        viewBox="0 0 320 360"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Character parts composition"
      >
        {layers.map((part) => (
          <g
            key={part!.id}
            dangerouslySetInnerHTML={{ __html: part!.svg }}
          />
        ))}
      </svg>
    </div>
  );
}
