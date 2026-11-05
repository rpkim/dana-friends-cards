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

/** Classic brand friends scenes — Dana & Friends back always uses these. */
const BACK_SCENE: Record<PaletteId, string> = {
  electric: "/art/backs/friends-electric.jpg",
  autumn: "/art/backs/friends-autumn.jpg",
  aura: "/art/backs/friends-aura.jpg",
  sparkle: "/art/backs/friends-sparkle.jpg",
};

/**
 * Dense play back. Dana & Friends = stock theme art. Name back may pass a
 * personalized `sceneUrl`. No circular inset, no ring, no face overlay.
 */
export function CardBack({
  theme,
  className,
  title = "Dana & Friends",
  footer = "Dana’s Special Card • 2026",
  sceneUrl,
}: Props) {
  const ink = theme.id === "aura" ? "#EAF0FF" : theme.text;
  const field = theme.id === "aura" ? theme.panel : "#FFF8E8";
  const titleClass =
    theme.id === "electric"
      ? "card-back-title--electric"
      : theme.id === "autumn"
        ? "card-back-title--autumn"
        : theme.id === "aura"
          ? "card-back-title--aura"
          : "card-back-title--sparkle";
  const sloganColor = theme.id === "aura" ? "#FFE56A" : theme.accentDeep;
  const footerColor = theme.id === "aura" ? "#A8C4FF" : theme.accentDeep;
  const scene = sceneUrl || BACK_SCENE[theme.id];
  const personalized = !!sceneUrl;

  return (
    <article
      className={`card-back relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[18px] border-[6px] shadow-[0_12px_28px_rgba(0,0,0,.28)] sm:rounded-[22px] sm:border-[7px] ${className ?? ""}`}
      style={{
        borderColor: theme.border,
        background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 55%, ${theme.accentDeep} 140%)`,
      }}
      data-card-side="back"
      data-personalized-scene={personalized ? "1" : "0"}
    >
      <div
        className="absolute inset-[7px] bottom-[11px] grid grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] gap-[2px] rounded-[11px] border-[2.5px] px-1.5 pb-1 pt-1.5 sm:inset-[10px] sm:bottom-[14px] sm:gap-[3px] sm:rounded-[14px] sm:border-[3px] sm:px-2 sm:pb-1.5 sm:pt-2"
        style={{
          borderColor: theme.accentDeep,
          background: field,
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
          className="relative z-10 min-h-0 w-full overflow-hidden rounded-[8px] border-[2px] sm:rounded-[12px] sm:border-[2.5px]"
          style={{ borderColor: theme.accentDeep, background: theme.accentSoft }}
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
          className="relative z-10 mx-0.5 rounded-lg border-[2px] px-1 py-[3px] text-center font-display text-[0.52rem] font-bold leading-tight sm:rounded-xl sm:border-[2.5px] sm:px-1.5 sm:py-1 sm:text-[0.72rem]"
          style={{
            borderColor: theme.accentDeep,
            background: theme.accentSoft,
            color: theme.id === "aura" ? theme.accentDeep : theme.text,
          }}
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
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[9px] sm:h-[12px]"
        style={{
          background: `repeating-linear-gradient(135deg, #111 0 8px, ${theme.accent} 8px 16px)`,
        }}
      />
    </article>
  );
}
