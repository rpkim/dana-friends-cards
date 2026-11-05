"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import type { PaletteId, Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  className?: string;
};

/** Painted center scene per chrome palette — kid + original friend creatures. */
const BACK_ART: Record<PaletteId, string> = {
  electric: "/art/backs/friends-electric.jpg",
  autumn: "/art/backs/friends-autumn.jpg",
  aura: "/art/backs/friends-aura.jpg",
  sparkle: "/art/backs/friends-sparkle.jpg",
};

/**
 * General Dana & Friends play back (not invitation/QR).
 * Matches print-sheet reference layout; recolored per chrome palette.
 */
export function CardBack({ theme, className }: Props) {
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

  return (
    <article
      className={`card-back relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[22px] border-[7px] shadow-[0_12px_28px_rgba(0,0,0,.28)] ${className ?? ""}`}
      style={{
        borderColor: theme.border,
        background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 55%, ${theme.accentDeep} 140%)`,
      }}
      data-card-side="back"
    >
      <div
        className="absolute inset-[10px] bottom-[18px] flex flex-col items-stretch rounded-[14px] border-[3px] px-2 pb-2 pt-2.5"
        style={{
          borderColor: theme.accentDeep,
          background: field,
          color: ink,
        }}
      >
        <div className="pointer-events-none absolute left-1.5 top-1.5 z-20">
          <FriendBadge size={14} />
        </div>
        <div className="pointer-events-none absolute right-1.5 top-1.5 z-20">
          <FriendBadge size={14} />
        </div>
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-20">
          <MotifIcon motif={theme.motif} size={14} />
        </div>
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-20">
          <MotifIcon motif={theme.motif} size={14} />
        </div>

        <h2
          className={`font-display relative z-10 shrink-0 text-center text-[1.35rem] font-bold leading-none tracking-tight sm:text-[1.55rem] ${titleClass}`}
        >
          Dana &amp; Friends
        </h2>

        {/* Fixed aspect so the painted scene stays large (not a CSS collapse). */}
        <div
          className="relative z-10 mx-auto mt-1.5 w-[94%] shrink-0 overflow-hidden rounded-[12px] border-[2.5px]"
          style={{
            borderColor: theme.accentDeep,
            background: theme.accentSoft,
            aspectRatio: "1 / 1",
            maxHeight: "58%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BACK_ART[theme.id]}
            alt="Kid in sun hoodie with original friend creatures"
            className="h-full w-full object-cover object-[center_30%]"
            draggable={false}
          />
        </div>

        <div className="relative z-10 mt-auto flex shrink-0 flex-col gap-1 pt-1.5">
          <p
            className="text-center font-display text-[0.78rem] font-bold uppercase tracking-wide sm:text-[0.88rem]"
            style={{
              color: theme.id === "aura" ? "#FFE56A" : theme.accentDeep,
            }}
          >
            Let’s play together!
          </p>

          <div
            className="mx-1 rounded-xl border-[2.5px] px-2 py-1 text-center font-display text-[0.66rem] font-bold leading-tight sm:text-[0.72rem]"
            style={{
              borderColor: theme.accentDeep,
              background: theme.accentSoft,
              color: theme.id === "aura" ? theme.accentDeep : theme.text,
            }}
          >
            Endless Energy &amp; Friendship!
          </div>

          <p
            className="text-center text-[0.5rem] font-bold uppercase tracking-[0.12em] opacity-85"
            style={{
              color: theme.id === "aura" ? "#A8C4FF" : theme.accentDeep,
            }}
          >
            Dana’s Special Card • 2026
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[12px]"
        style={{
          background: `repeating-linear-gradient(135deg, #111 0 9px, ${theme.accent} 9px 18px)`,
        }}
      />
    </article>
  );
}
