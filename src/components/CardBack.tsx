"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import type { Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  className?: string;
};

/** General branded Dana & Friends card back (not invitation / QR). */
export function CardBack({ theme, className }: Props) {
  return (
    <article
      className={`card-back relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[18px] border-[6px] p-3 shadow-xl ${className ?? ""}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, ${theme.accentSoft}, ${theme.accent} 40%, ${theme.accentDeep})`,
        borderColor: theme.border,
      }}
      data-card-side="back"
    >
      <div
        className="absolute inset-3 rounded-[12px] border-2"
        style={{ borderColor: "rgba(255,255,255,.45)" }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-between py-4 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-yellow-200">
            <MotifIcon motif={theme.motif} size={22} />
            <FriendBadge size={22} />
            <MotifIcon motif={theme.motif} size={22} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/80">
            Official Play Set
          </p>
        </div>

        <div className="space-y-3 px-2">
          <div
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-inner"
            style={{
              background: `conic-gradient(from 40deg, ${theme.accent}, #fff, ${theme.accentDeep}, ${theme.accent})`,
              borderColor: "#fff",
            }}
          >
            <div
              className="flex h-20 w-20 flex-col items-center justify-center rounded-full"
              style={{ background: theme.accentDeep }}
            >
              <FriendBadge size={28} />
              <span className="mt-1 text-[9px] font-black tracking-wide text-white">
                D&amp;F
              </span>
            </div>
          </div>

          <h2
            className="font-[family-name:var(--font-display)] text-3xl font-black leading-none text-white"
            style={{ textShadow: "0 3px 0 rgba(0,0,0,.35)" }}
          >
            DANA
            <br />
            <span className="text-2xl">&amp; FRIENDS</span>
          </h2>
          <p className="text-xs font-semibold text-white/90">
            Collect • Play • Share laughs
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-center gap-3 text-yellow-200">
            <MotifIcon motif="bolt" size={16} />
            <MotifIcon motif="leaf" size={16} />
            <MotifIcon motif="aura" size={16} />
            <MotifIcon motif="sparkle" size={16} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
            © DANA &amp; FRIENDS 2026
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 opacity-90"
        style={{
          background: `repeating-linear-gradient(135deg, #111 0 8px, ${theme.accent} 8px 16px)`,
        }}
      />
    </article>
  );
}
