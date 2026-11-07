"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import type { PaletteId, Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  className?: string;
  /** Back title. Brand default: "Dana & Friends". */
  title?: string;
  /** Footer line under the tagline. */
  footer?: string;
  /**
   * Personalized friends-party illustration for the {name} & Friends back.
   * Dana & Friends brand back ignores this and always uses stock BACK_SCENE art
   * so the classic cream/sparkle friends background stays unchanged.
   */
  sceneUrl?: string | null;
};

/** Classic brand friends scenes. Standard Dana & Friends backs use these. */
const BACK_SCENE: Record<PaletteId, string> = {
  electric: "/art/backs/friends-electric.jpg",
  autumn: "/art/backs/friends-autumn.jpg",
  aura: "/art/backs/friends-aura.jpg",
  sparkle: "/art/backs/friends-sparkle.jpg",
};

/** Foil backs use their own illustration. They do not tint the stock photo. */
const FOIL_SCENE = {
  rainbow: "/art/backs/friends-rainbow.jpg",
  gold: "/art/backs/friends-gold.jpg",
} as const;

/**
 * Dense play back. A standard Dana & Friends back uses stock theme art.
 * Rainbow and gold backs use their own foil scenes. A name back may pass a
 * personalized `sceneUrl`. No circular inset, no ring, no face overlay.
 */
export function CardBack({
  theme,
  className,
  title = "Dana & Friends",
  footer = "Dana’s Special Card • 2026",
  sceneUrl,
}: Props) {
  const special = theme.special;
  const isRainbow = special === "rainbow";
  const isGold = special === "gold";
  const ink = special ? "#2a2118" : theme.id === "aura" ? "#EAF0FF" : theme.text;
  const field = special ? "#FFF8E8" : theme.id === "aura" ? theme.panel : "#FFF8E8";
  const titleClass = special
    ? `card-back-title--${special}`
    : theme.id === "electric"
      ? "card-back-title--electric"
      : theme.id === "autumn"
        ? "card-back-title--autumn"
        : theme.id === "aura"
          ? "card-back-title--aura"
          : "card-back-title--sparkle";
  const sloganColor = special
    ? special === "gold"
      ? "#6a4a08"
      : "#4a2a6a"
    : theme.id === "aura"
      ? "#FFE56A"
      : theme.accentDeep;
  const footerColor = special ? sloganColor : theme.id === "aura" ? "#A8C4FF" : theme.accentDeep;
  // Dana & Friends brand title uses stock art. Foil backs use a dedicated scene.
  const isBrandDana = (title || "Dana & Friends").trim() === "Dana & Friends";
  const scene = isRainbow
    ? FOIL_SCENE.rainbow
    : isGold
      ? FOIL_SCENE.gold
      : isBrandDana
        ? BACK_SCENE[theme.id]
        : sceneUrl || BACK_SCENE[theme.id];
  const personalized = !isBrandDana && !!sceneUrl;

  return (
    <article
      className={`card-back card-scaled relative aspect-[63/88] w-full ${className ?? ""}`}
      data-card-side="back"
      data-personalized-scene={personalized ? "1" : "0"}
      data-special={special || undefined}
    >
      <div
        className={`card-scale relative flex flex-col overflow-hidden rounded-[18px] sm:rounded-[22px] ${
          isRainbow
            ? "card-back-rainbow-shell border-0"
            : isGold
              ? "card-back-gold-shell border-0"
              : "border-[6px] sm:border-[7px]"
        }`}
        style={
          isRainbow || isGold
            ? undefined
            : {
                borderColor: theme.border,
                background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 55%, ${theme.accentDeep} 140%)`,
              }
        }
      >
      {isRainbow ? <RainbowFoil /> : null}
      {isGold ? <GoldFoil /> : null}
      <div
        className={
          isRainbow || isGold
            ? "card-back-face absolute z-10 inset-x-[20px] top-[40px] bottom-[20px] grid grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] gap-[2px] rounded-[12px] border-[4px] px-1.5 pb-1 pt-1.5 sm:gap-[3px] sm:rounded-[14px] sm:px-2 sm:pb-1.5 sm:pt-2"
            : "absolute inset-[7px] bottom-[11px] grid grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] gap-[2px] rounded-[11px] border-[2.5px] px-1.5 pb-1 pt-1.5 sm:inset-[10px] sm:bottom-[14px] sm:gap-[3px] sm:rounded-[14px] sm:border-[3px] sm:px-2 sm:pb-1.5 sm:pt-2"
        }
        style={{
          borderColor: isRainbow || isGold ? "transparent" : theme.accentDeep,
          background: isRainbow
            ? "linear-gradient(#FFF8E8, #FFF8E8) padding-box, linear-gradient(135deg, #ff4d7a, #ffe14a, #5dff9a, #4eb6ff, #d08bff) border-box"
            : isGold
              ? "linear-gradient(#FFF8E8, #FFF8E8) padding-box, linear-gradient(145deg, #fff6cc, #f3d37a, #c9922a, #fff1b8, #e6c35c) border-box"
              : field,
          color: ink,
        }}
      >
        <div className="pointer-events-none absolute left-1 top-1 z-20 sm:left-1.5 sm:top-1.5">
          <FriendBadge size={12} />
        </div>
        <div className="pointer-events-none absolute right-1 top-1 z-20 sm:right-1.5 sm:top-1.5">
          <FriendBadge size={12} />
        </div>
        <div className="pointer-events-none absolute bottom-1 left-1 z-20 sm:bottom-1.5 sm:left-1.5">
          <MotifIcon motif={theme.motif} size={12} />
        </div>
        <div className="pointer-events-none absolute bottom-1 right-1 z-20 sm:bottom-1.5 sm:right-1.5">
          <MotifIcon motif={theme.motif} size={12} />
        </div>

        <h2
          className={`font-display relative z-10 px-2 text-center text-[0.95rem] font-bold leading-[1.05] tracking-tight sm:px-3 sm:text-[1.45rem] ${titleClass}`}
        >
          {title}
        </h2>

        <div
          className={`relative z-10 min-h-0 w-full overflow-hidden rounded-[8px] sm:rounded-[12px] ${
            isRainbow || isGold ? "border-[3px]" : "border-[2px] sm:border-[2.5px]"
          }`}
          style={
            isRainbow
              ? {
                  borderColor: "transparent",
                  background:
                    "linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #ff4d7a, #ffe14a, #5dff9a, #4eb6ff, #d08bff) border-box",
                }
              : isGold
                ? {
                    borderColor: "transparent",
                    background:
                      "linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fff6cc, #e6c35c, #a97818, #fff1b8) border-box",
                  }
                : { borderColor: theme.accentDeep, background: theme.accentSoft }
          }
        >
          {/* One illustration only — no inset face, no ring, no second face */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene}
            alt={`${title} card back art`}
            className="absolute inset-0 h-full w-full object-cover object-[center_32%]"
            draggable={false}
            data-back-scene="1"
          />
        </div>

        <p
          className="relative z-10 px-1 text-center font-display text-[0.62rem] font-bold uppercase leading-tight tracking-wide sm:text-[0.88rem]"
          style={{ color: sloganColor }}
        >
          Let’s play together!
        </p>

        <div
          className={`relative z-10 mx-0.5 rounded-lg px-1 py-[3px] text-center font-display text-[0.52rem] font-bold leading-tight sm:rounded-xl sm:px-1.5 sm:py-1 sm:text-[0.72rem] ${
            isRainbow || isGold ? "border-[3px]" : "border-[2px] sm:border-[2.5px]"
          }`}
          style={
            isRainbow
              ? {
                  borderColor: "transparent",
                  background:
                    "linear-gradient(#fffdf8, #fffdf8) padding-box, linear-gradient(90deg, #ff6d9a, #ffe14a, #7dffb0, #6ec5ff, #e0a0ff) border-box",
                  color: "#241428",
                }
              : isGold
                ? {
                    borderColor: "transparent",
                    background:
                      "linear-gradient(#fffdf6, #fffdf6) padding-box, linear-gradient(90deg, #fff4c2, #e6c35c, #c9922a, #fff6cc) border-box",
                    color: "#3a2a08",
                  }
                : {
                    borderColor: theme.accentDeep,
                    background: theme.accentSoft,
                    color: theme.id === "aura" ? theme.accentDeep : theme.text,
                  }
          }
        >
          Endless Energy &amp; Friendship!
        </div>

        <p
          className="relative z-10 px-1 pb-0.5 text-center text-[0.42rem] font-bold uppercase leading-tight tracking-[0.08em] opacity-90 sm:text-[0.55rem] sm:tracking-[0.1em]"
          style={{ color: footerColor }}
        >
          {footer}
        </p>
      </div>

      <div
        className={
          isRainbow || isGold
            ? "pointer-events-none absolute bottom-0 left-0 right-0 z-[4] h-[20px]"
            : "pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[9px] sm:h-[12px]"
        }
        style={{
          background: isRainbow
            ? "linear-gradient(90deg, #ff3d6e 0%, #ff8a1e 16%, #ffe23a 34%, #5dff7a 52%, #2ad4ff 70%, #6a6bff 84%, #e05bff 100%)"
            : isGold
              ? "linear-gradient(90deg, #fff6cc 0%, #e6c35c 22%, #a97818 42%, #fff1b8 58%, #d4a017 78%, #fff6cc 100%)"
              : `repeating-linear-gradient(135deg, #111 0 8px, ${theme.accent} 8px 16px)`,
        }}
      />
      </div>
    </article>
  );
}

/** Rainbow foil sits in the frame only. The cream face covers the scene and type. */
function RainbowFoil() {
  return (
    <>
      <div className="card-back-rainbow-sheen" aria-hidden />
      <span className="card-back-rainbow-corner card-back-rainbow-corner--tl" aria-hidden />
      <span className="card-back-rainbow-corner card-back-rainbow-corner--tr" aria-hidden />
      <span className="card-back-rainbow-corner card-back-rainbow-corner--bl" aria-hidden />
      <span className="card-back-rainbow-corner card-back-rainbow-corner--br" aria-hidden />
      <span className="card-back-rainbow-banner" data-special-mark="1">
        Special
      </span>
    </>
  );
}

/** Gold foil sits in the frame only. The cream face covers the scene and type. */
function GoldFoil() {
  return (
    <>
      <div className="card-back-gold-sheen" aria-hidden />
      <span className="card-back-gold-corner card-back-gold-corner--tl" aria-hidden />
      <span className="card-back-gold-corner card-back-gold-corner--tr" aria-hidden />
      <span className="card-back-gold-corner card-back-gold-corner--bl" aria-hidden />
      <span className="card-back-gold-corner card-back-gold-corner--br" aria-hidden />
      <span className="card-back-gold-banner" data-special-mark="1">
        Special
      </span>
    </>
  );
}
