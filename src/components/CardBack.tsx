"use client";

import type { Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  className?: string;
};

/** Premium branded Dana & Friends card back (general — not invitation/QR). */
export function CardBack({ theme, className }: Props) {
  return (
    <article
      className={`card-back relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[22px] border-[7px] shadow-[0_12px_28px_rgba(0,0,0,.28)] ${className ?? ""}`}
      style={{ borderColor: theme.border }}
      data-card-side="back"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/card-back.jpg"
        alt="Dana & Friends card back"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{
          background: `linear-gradient(160deg, ${theme.accentSoft}, transparent 40%, ${theme.accentDeep})`,
        }}
      />
      <div className="absolute inset-[10px] rounded-[14px] border border-white/35" />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[14px]"
        style={{
          background: `repeating-linear-gradient(135deg, #111 0 9px, ${theme.accent} 9px 18px)`,
        }}
      />
    </article>
  );
}
