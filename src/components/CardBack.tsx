"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import type { Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  className?: string;
};

/**
 * General Dana & Friends play back (not invitation/QR).
 * Same layout as the print-sheet reference; recolored per chrome palette.
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
        className="absolute inset-[10px] bottom-[18px] grid grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] gap-1 rounded-[14px] border-[3px] px-2.5 pb-2 pt-3"
        style={{
          borderColor: theme.accentDeep,
          background: field,
          color: ink,
        }}
      >
        <div className="pointer-events-none absolute left-2 top-2">
          <FriendBadge size={16} />
        </div>
        <div className="pointer-events-none absolute right-2 top-2">
          <FriendBadge size={16} />
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2">
          <MotifIcon motif={theme.motif} size={16} />
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2">
          <MotifIcon motif={theme.motif} size={16} />
        </div>

        <h2
          className={`font-display relative z-10 text-center text-[1.45rem] font-bold leading-none tracking-tight sm:text-[1.65rem] ${titleClass}`}
        >
          Dana &amp; Friends
        </h2>

        <div className="relative z-10 flex min-h-0 items-center justify-center overflow-hidden px-1">
          <BackFriendsArt
            accent={theme.accent}
            deep={theme.accentDeep}
            soft={theme.accentSoft}
          />
        </div>

        <p
          className="relative z-10 text-center font-display text-[0.78rem] font-bold uppercase tracking-wide sm:text-[0.88rem]"
          style={{ color: theme.id === "aura" ? "#FFE56A" : theme.accentDeep }}
        >
          Let’s play together!
        </p>

        <div
          className="relative z-10 mx-1 rounded-xl border-[2.5px] px-2 py-1 text-center font-display text-[0.68rem] font-bold leading-tight sm:text-[0.74rem]"
          style={{
            borderColor: theme.accentDeep,
            background: theme.accentSoft,
            color: theme.id === "aura" ? theme.accentDeep : theme.text,
          }}
        >
          Endless Energy &amp; Friendship!
        </div>

        <p
          className="relative z-10 text-center text-[0.52rem] font-bold uppercase tracking-[0.12em] opacity-85 sm:text-[0.55rem]"
          style={{ color: theme.id === "aura" ? "#A8C4FF" : theme.accentDeep }}
        >
          Dana’s Special Card • 2026
        </p>
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

/** Original kid + friend-creature cluster (no Nintendo designs). */
function BackFriendsArt({
  accent,
  deep,
  soft,
}: {
  accent: string;
  deep: string;
  soft: string;
}) {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-full max-h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Kid in sun hoodie with original friend creatures"
    >
      <ellipse cx="140" cy="178" rx="90" ry="14" fill={soft} opacity="0.85" />

      <g transform="translate(28,95)">
        <circle cx="22" cy="28" r="26" fill="#FFE56A" stroke="#1a1a1a" strokeWidth="2" />
        <path
          d="M22 6l4.2 10.5H38l-9 6.8 3.4 11-10.4-7.2-10.4 7.2 3.4-11-9-6.8h11.8z"
          fill="#fff"
          stroke="#1a1a1a"
          strokeWidth="1.4"
        />
        <circle cx="14" cy="26" r="2.2" fill="#1a1a1a" />
        <circle cx="30" cy="26" r="2.2" fill="#1a1a1a" />
        <path d="M16 36c4 4 10 4 14 0" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      <g transform="translate(8,130)">
        <ellipse cx="28" cy="28" rx="28" ry="24" fill="#FF7AB8" stroke="#1a1a1a" strokeWidth="2" />
        <ellipse cx="18" cy="22" rx="6" ry="8" fill="#FFD6EA" />
        <circle cx="18" cy="26" r="2" fill="#1a1a1a" />
        <circle cx="34" cy="26" r="2" fill="#1a1a1a" />
        <path d="M20 34c4 3 10 3 14 0" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M28 4c0 8 6 10 6 10" fill="none" stroke="#2a8f3a" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g transform="translate(198,88)">
        <ellipse cx="30" cy="36" rx="32" ry="24" fill="#A8C4FF" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="14" cy="28" r="14" fill="#A8C4FF" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="44" cy="26" r="16" fill="#A8C4FF" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="22" cy="34" r="2.2" fill="#1a1a1a" />
        <circle cx="38" cy="34" r="2.2" fill="#1a1a1a" />
        <path d="M24 44c5 4 12 4 16 0" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      <g transform="translate(205,132)">
        <circle cx="28" cy="28" r="26" fill="#E8A020" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="28" cy="28" r="10" fill={soft} stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="14" cy="16" r="3" fill="#FF7AB8" />
        <circle cx="40" cy="14" r="3" fill="#2F6BFF" />
        <circle cx="44" cy="32" r="3" fill="#FFE56A" />
        <circle cx="18" cy="40" r="3" fill="#FF7AB8" />
        <circle cx="20" cy="26" r="2" fill="#1a1a1a" />
        <circle cx="36" cy="26" r="2" fill="#1a1a1a" />
        <path d="M22 34c4 3 10 3 12 0" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <g transform="translate(175,55)">
        <ellipse cx="26" cy="40" rx="22" ry="26" fill="#F4B860" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M8 22l8 14H4z" fill="#E87722" stroke="#1a1a1a" strokeWidth="1.6" />
        <path d="M44 22l-8 14h12z" fill="#E87722" stroke="#1a1a1a" strokeWidth="1.6" />
        <circle cx="18" cy="40" r="2.2" fill="#1a1a1a" />
        <circle cx="32" cy="40" r="2.2" fill="#1a1a1a" />
        <ellipse cx="26" cy="48" rx="5" ry="3.5" fill="#FF9AC8" stroke="#1a1a1a" strokeWidth="1" />
        <path d="M26 8c2 8 8 10 8 10" fill="none" stroke="#2a8f3a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="34" cy="16" r="5" fill="#6BCB77" stroke="#1a1a1a" strokeWidth="1.4" />
      </g>

      <g transform="translate(55,48)">
        <ellipse cx="10" cy="8" rx="7" ry="16" fill="#FFD6EA" stroke="#1a1a1a" strokeWidth="1.8" />
        <ellipse cx="28" cy="8" rx="7" ry="16" fill="#FFD6EA" stroke="#1a1a1a" strokeWidth="1.8" />
        <circle cx="19" cy="36" r="22" fill="#FFB3D6" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="12" cy="34" r="2.2" fill="#1a1a1a" />
        <circle cx="26" cy="34" r="2.2" fill="#1a1a1a" />
        <path d="M14 44c4 3 10 3 12 0" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      <g transform="translate(92,42)">
        <path
          d="M18 70c-18-18-28-8-30 2"
          fill="none"
          stroke={accent}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M78 70c18-18 28-8 30 2"
          fill="none"
          stroke={accent}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <circle cx="-12" cy="70" r="8" fill="#F5C9A8" stroke="#1a1a1a" strokeWidth="1.6" />
        <circle cx="108" cy="70" r="8" fill="#F5C9A8" stroke="#1a1a1a" strokeWidth="1.6" />

        <path
          d="M18 78c4 42 20 58 30 58s26-16 30-58c-8 8-18 12-30 12s-22-4-30-12z"
          fill={accent}
          stroke="#1a1a1a"
          strokeWidth="2.2"
        />
        <path
          d="M28 62c-2-22 8-30 12-30 2 10 2 22-2 30z"
          fill={accent}
          stroke="#1a1a1a"
          strokeWidth="2"
        />
        <path
          d="M68 62c2-22-8-30-12-30-2 10-2 22 2 30z"
          fill={accent}
          stroke="#1a1a1a"
          strokeWidth="2"
        />
        <ellipse cx="34" cy="48" rx="4" ry="6" fill={deep} opacity="0.35" />
        <ellipse cx="62" cy="48" rx="4" ry="6" fill={deep} opacity="0.35" />

        <circle cx="48" cy="58" r="28" fill="#F5C9A8" stroke="#1a1a1a" strokeWidth="2.2" />
        <path
          d="M22 58c2-28 18-36 26-36 10 0 24 10 26 36-8-10-18-14-26-14s-18 4-26 14z"
          fill="#2A1A12"
          stroke="#1a1a1a"
          strokeWidth="1.6"
        />
        <circle cx="38" cy="58" r="3.2" fill="#1a1a1a" />
        <circle cx="58" cy="58" r="3.2" fill="#1a1a1a" />
        <circle cx="39.2" cy="56.8" r="1" fill="#fff" />
        <circle cx="59.2" cy="56.8" r="1" fill="#fff" />
        <path
          d="M40 68c5 6 13 6 18 0"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="30" cy="66" r="4" fill="#FF9AC8" opacity="0.55" />
        <circle cx="66" cy="66" r="4" fill="#FF9AC8" opacity="0.55" />
        <circle cx="48" cy="108" r="10" fill="#FFE56A" stroke="#1a1a1a" strokeWidth="1.6" />
        <circle cx="44" cy="106" r="1.4" fill="#1a1a1a" />
        <circle cx="52" cy="106" r="1.4" fill="#1a1a1a" />
        <path d="M45 111c2 2 5 2 7 0" fill="none" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
