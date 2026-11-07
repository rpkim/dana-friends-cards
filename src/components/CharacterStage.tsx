"use client";

import type { AccessoryKind, ArtPlan } from "@/lib/parts";

type Props = {
  artUrl: string;
  className?: string;
  /** When set (parts mixer), apply look/outfit/backdrop/accessory overlays */
  artPlan?: ArtPlan | null;
};

/**
 * Art-frame portrait. Framing CSS lives on `.card-art-image` so baked art,
 * Gemini results, and photo previews share the same face-safe crop.
 * Parts-mixer overlays make Look/Outfit/Accessory 1+2/Backdrop visibly change
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
        style={
          artPlan?.lookFilter && artPlan.lookFilter !== "none"
            ? { filter: artPlan.lookFilter }
            : undefined
        }
      />

      {artPlan && artPlan.lookTint !== "transparent" && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: artPlan.lookTint }}
          aria-hidden
        />
      )}

      {artPlan && artPlan.outfitWash !== "transparent" && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: artPlan.outfitWash, mixBlendMode: "multiply" }}
          aria-hidden
        />
      )}

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
            boxShadow: `inset 0 0 52px 12px ${artPlan.vignette}`,
          }}
          aria-hidden
        />
      )}

      {artPlan &&
        artPlan.accessories.map((kind, slot) =>
          kind === "none" ? null : (
            <AccessoryOverlay key={`acc-${slot}-${kind}`} kind={kind} slot={slot as 0 | 1} />
          ),
        )}

      {artPlan && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-[3] flex max-w-[94%] -translate-x-1/2 flex-wrap justify-center gap-1">
          {[
            artPlan.labels.look,
            artPlan.labels.outfit,
            artPlan.labels.accessory1 !== "None"
              ? artPlan.labels.accessory1
              : null,
            artPlan.labels.accessory2 !== "None"
              ? artPlan.labels.accessory2
              : null,
            artPlan.labels.backdrop,
          ]
            .filter(Boolean)
            .map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="rounded-full bg-black/75 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white shadow"
                data-card-chrome="part-label"
              >
                {label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

/** Slot 0 = Accessory 1 (upper / left bias); slot 1 = Accessory 2 (lower / right bias). */
function AccessoryOverlay({
  kind,
  slot,
}: {
  kind: Exclude<AccessoryKind, "none">;
  slot: 0 | 1;
}) {
  const s = slot === 0 ? "a" : "b";

  if (kind === "shades") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-[12%] w-[42%] -translate-x-1/2 drop-shadow-md ${
          s === "a"
            ? "left-1/2 top-[28%]"
            : "left-[52%] top-[31%]"
        }`}
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

  if (kind === "glasses") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-[11%] w-[40%] -translate-x-1/2 drop-shadow-md ${
          s === "a" ? "left-1/2 top-[29%]" : "left-[48%] top-[32%]"
        }`}
        viewBox="0 0 120 40"
        aria-hidden
      >
        <circle cx="35" cy="20" r="14" fill="rgba(255,255,255,.25)" stroke="#5b6bc0" strokeWidth="3" />
        <circle cx="85" cy="20" r="14" fill="rgba(255,255,255,.25)" stroke="#5b6bc0" strokeWidth="3" />
        <path d="M49 20 H71" stroke="#5b6bc0" strokeWidth="3" />
        <path d="M21 18 H8" stroke="#5b6bc0" strokeWidth="2.5" />
        <path d="M99 18 H112" stroke="#5b6bc0" strokeWidth="2.5" />
      </svg>
    );
  }

  if (kind === "bow-bag") {
    return (
      <div
        className={`pointer-events-none absolute z-[2] flex h-12 w-12 flex-col items-center justify-center rounded-2xl border-[3px] border-pink-300 bg-black/90 text-[9px] font-black leading-tight text-pink-200 shadow-lg ${
          s === "a" ? "bottom-[16%] left-[6%]" : "bottom-[14%] left-[18%]"
        }`}
        aria-hidden
      >
        <span className="text-pink-300">♥</span>
        bag
      </div>
    );
  }

  if (kind === "star-pin") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-10 w-10 drop-shadow-lg ${
          s === "a" ? "bottom-[30%] right-[16%]" : "bottom-[22%] right-[28%]"
        }`}
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

  if (kind === "donut" || kind === "snack") {
    const pastry = kind === "snack";
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-12 w-12 drop-shadow-lg ${
          s === "a" ? "bottom-[12%] right-[6%]" : "bottom-[10%] right-[20%]"
        }`}
        viewBox="0 0 48 48"
        aria-hidden
      >
        {pastry ? (
          <>
            <ellipse cx="24" cy="28" rx="16" ry="10" fill="#E8B87A" stroke="#C47A3A" strokeWidth="2" />
            <path d="M10 26 Q24 10 38 26" fill="#FF8AB8" stroke="#C47A3A" strokeWidth="1.5" />
            <circle cx="18" cy="20" r="1.4" fill="#fff" />
            <circle cx="28" cy="18" r="1.2" fill="#fff" />
          </>
        ) : (
          <>
            <circle cx="24" cy="24" r="18" fill="#F6C28B" stroke="#C47A3A" strokeWidth="2" />
            <circle cx="24" cy="24" r="18" fill="none" stroke="#FF8AB8" strokeWidth="7" />
            <circle cx="24" cy="24" r="7" fill="#FFF4E0" stroke="#C47A3A" strokeWidth="2" />
            <circle cx="16" cy="16" r="1.6" fill="#fff" />
            <circle cx="30" cy="14" r="1.4" fill="#fff" />
            <circle cx="34" cy="24" r="1.5" fill="#fff" />
          </>
        )}
      </svg>
    );
  }

  if (kind === "hair-bow") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-12 w-14 drop-shadow-md ${
          s === "a" ? "left-[12%] top-[12%]" : "right-[10%] top-[14%]"
        }`}
        viewBox="0 0 64 48"
        aria-hidden
      >
        <path d="M8 24 C8 8, 28 8, 32 24 C28 40, 8 40, 8 24 Z" fill="#FF7AB8" stroke="#C2185B" strokeWidth="2" />
        <path d="M56 24 C56 8, 36 8, 32 24 C36 40, 56 40, 56 24 Z" fill="#FF7AB8" stroke="#C2185B" strokeWidth="2" />
        <circle cx="32" cy="24" r="6" fill="#FFD54A" stroke="#C48A00" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === "star-clip") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-9 w-9 drop-shadow-md ${
          s === "a" ? "left-[18%] top-[18%]" : "right-[16%] top-[16%]"
        }`}
        viewBox="0 0 40 40"
        aria-hidden
      >
        <path
          d="M20 2 L24.5 14 L38 14.5 L27 22.5 L31.5 35 L20 27.5 L8.5 35 L13 22.5 L2 14.5 L15.5 14 Z"
          fill="#FFE56A"
          stroke="#C48A00"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "scarf") {
    return (
      <div
        className={`pointer-events-none absolute z-[2] h-4 w-[58%] -translate-x-1/2 rounded-full border-2 border-rose-400/80 shadow ${
          s === "a" ? "left-1/2 top-[54%]" : "left-[48%] top-[58%]"
        }`}
        style={{
          background:
            "repeating-linear-gradient(90deg, #ff8ab8 0 10px, #ffe56a 10px 20px, #7ec8ff 20px 30px)",
        }}
        aria-hidden
      />
    );
  }

  if (kind === "headphones") {
    return (
      <svg
        className={`pointer-events-none absolute z-[2] h-[22%] w-[58%] -translate-x-1/2 drop-shadow-md ${
          s === "a" ? "left-1/2 top-[10%]" : "left-[50%] top-[8%]"
        }`}
        viewBox="0 0 120 60"
        aria-hidden
      >
        <path
          d="M18 38 C18 14, 102 14, 102 38"
          fill="none"
          stroke="#7B61FF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="8" y="30" width="18" height="24" rx="6" fill="#FF9AC8" stroke="#7B61FF" strokeWidth="2" />
        <rect x="94" y="30" width="18" height="24" rx="6" fill="#FF9AC8" stroke="#7B61FF" strokeWidth="2" />
      </svg>
    );
  }

  // flower
  return (
    <svg
      className={`pointer-events-none absolute z-[2] h-11 w-11 drop-shadow-md ${
        s === "a" ? "left-[14%] top-[20%]" : "right-[12%] top-[18%]"
      }`}
      viewBox="0 0 48 48"
      aria-hidden
    >
      <circle cx="24" cy="16" r="7" fill="#FF8AB8" />
      <circle cx="16" cy="24" r="7" fill="#FFB4D4" />
      <circle cx="32" cy="24" r="7" fill="#FFB4D4" />
      <circle cx="20" cy="32" r="7" fill="#FF8AB8" />
      <circle cx="28" cy="32" r="7" fill="#FF8AB8" />
      <circle cx="24" cy="24" r="5" fill="#FFE56A" stroke="#C48A00" strokeWidth="1" />
    </svg>
  );
}
