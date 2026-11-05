"use client";

import type { ArtPlan } from "@/lib/parts";

type Props = {
  artUrl: string;
  className?: string;
  /** When set (parts mixer), apply backdrop wash + accessory overlays */
  artPlan?: ArtPlan | null;
};

/**
 * Art-frame portrait. Framing CSS lives on `.card-art-image` so baked art,
 * Gemini results, and photo previews share the same face-safe crop.
 * Parts-mixer overlays make Look/Outfit/Accessory/Backdrop visibly change
 * even when Gemini image quota is unavailable.
 */
export function CharacterStage({ artUrl, className, artPlan }: Props) {
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

      {artPlan && artPlan.backdropWash !== "transparent" && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: artPlan.backdropWash }}
          aria-hidden
        />
      )}

      {artPlan && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            boxShadow: `inset 0 0 48px 10px ${artPlan.vignette}`,
          }}
          aria-hidden
        />
      )}

      {artPlan && artPlan.accessory !== "none" && (
        <AccessoryOverlay kind={artPlan.accessory} />
      )}

      {artPlan && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-[3] flex max-w-[92%] -translate-x-1/2 flex-wrap justify-center gap-1">
          {[
            artPlan.labels.look,
            artPlan.labels.outfit,
            artPlan.labels.accessory !== "None"
              ? artPlan.labels.accessory
              : null,
            artPlan.labels.backdrop,
          ]
            .filter(Boolean)
            .map((label) => (
              <span
                key={label as string}
                className="rounded-full bg-black/70 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white shadow"
              >
                {label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function AccessoryOverlay({ kind }: { kind: Exclude<ArtPlan["accessory"], "none"> }) {
  if (kind === "shades") {
    return (
      <svg
        className="pointer-events-none absolute left-1/2 top-[34%] z-[2] h-[18%] w-[52%] -translate-x-1/2 drop-shadow"
        viewBox="0 0 120 40"
        aria-hidden
      >
        <path
          d="M10 18 C18 6, 42 6, 50 18 L60 18 C68 6, 92 6, 100 18 L108 20 C100 34, 72 36, 60 26 L50 26 C38 36, 10 34, 2 20 Z"
          fill="rgba(255,105,180,.55)"
          stroke="#c2185b"
          strokeWidth="3"
        />
        <path d="M50 18 H60" stroke="#c2185b" strokeWidth="3" />
      </svg>
    );
  }

  if (kind === "bow-bag") {
    return (
      <div
        className="pointer-events-none absolute bottom-[18%] left-[8%] z-[2] flex h-12 w-12 items-center justify-center rounded-xl border-2 border-pink-300 bg-black/85 text-[10px] font-black text-pink-200 shadow-lg"
        aria-hidden
      >
        ♥ bag
      </div>
    );
  }

  if (kind === "star-pin") {
    return (
      <svg
        className="pointer-events-none absolute bottom-[34%] right-[20%] z-[2] h-9 w-9 drop-shadow"
        viewBox="0 0 40 40"
        aria-hidden
      >
        <path
          d="M20 2 L24.5 14 L38 14.5 L27 22.5 L31.5 35 L20 27.5 L8.5 35 L13 22.5 L2 14.5 L15.5 14 Z"
          fill="#FFD54A"
          stroke="#C48A00"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // donut
  return (
    <svg
      className="pointer-events-none absolute bottom-[14%] right-[8%] z-[2] h-12 w-12 drop-shadow"
      viewBox="0 0 48 48"
      aria-hidden
    >
      <circle cx="24" cy="24" r="18" fill="#F6C28B" stroke="#C47A3A" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#FF8AB8" strokeWidth="7" />
      <circle cx="24" cy="24" r="7" fill="#FFF4E0" stroke="#C47A3A" strokeWidth="2" />
      <circle cx="16" cy="16" r="1.6" fill="#fff" />
      <circle cx="30" cy="14" r="1.4" fill="#fff" />
      <circle cx="34" cy="24" r="1.5" fill="#fff" />
    </svg>
  );
}
