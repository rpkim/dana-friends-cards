"use client";

import type { CSSProperties } from "react";
import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import { CharacterStage } from "@/components/CharacterStage";
import type { Theme } from "@/lib/themes";

export type CardData = {
  theme: Theme;
  customName?: string;
  customHp?: number;
  artUrl: string;
};

type Props = {
  data: CardData;
  className?: string;
};

export function CardFront({ data, className }: Props) {
  const { theme, artUrl } = data;
  const name = (data.customName || theme.name).toUpperCase();
  const hp = data.customHp ?? theme.hp;
  const isDark = theme.id === "ritsuki";

  return (
    <article
      className={`card-front relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[22px] border-[7px] p-[7px] shadow-[0_12px_28px_rgba(0,0,0,.28)] ${className ?? ""}`}
      style={{
        background: cardFaceGradient(theme),
        borderColor: theme.border,
        color: theme.text,
      }}
      data-card-side="front"
    >
      <CornerScrews />
      <BorderMotifStrip motif={theme.motif} />

      {/* Header */}
      <header className="relative z-10 flex items-start justify-between gap-2 px-1.5 pt-1">
        <h2
          className="font-[family-name:var(--font-display)] text-[clamp(1.55rem,5vw,2.05rem)] font-black leading-none tracking-wide"
          style={nameStyle(theme, isDark)}
        >
          {name}
        </h2>
        <div className="mt-0.5 flex items-center gap-1">
          <MotifIcon motif={theme.motif} size={18} />
          <MotifIcon motif={theme.motif} size={14} />
          <div
            className="rounded-full px-2.5 py-0.5 text-[13px] font-black tracking-wide"
            style={{
              background: isDark ? theme.accent : "#fffef6",
              color: isDark ? "#fff" : "#111",
              boxShadow: "0 1px 0 rgba(0,0,0,.3), inset 0 0 0 1px rgba(0,0,0,.08)",
            }}
          >
            <span className="opacity-70">HP</span> {hp}
          </div>
        </div>
      </header>

      {/* Play type */}
      <div className="relative z-10 mb-1 mt-1 flex items-center gap-1 px-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-extrabold shadow-sm"
          style={{
            background: isDark ? "rgba(255,255,255,.92)" : "#fff",
            color: theme.accentDeep,
          }}
        >
          <MotifIcon motif={theme.motif} size={10} />
          {theme.playType}
        </span>
      </div>

      {/* Art frame */}
      <div
        className="relative z-10 mx-1 overflow-hidden rounded-[6px] border-[3.5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]"
        style={{
          borderColor: "#151515",
          background: theme.artBg,
          aspectRatio: "1 / 1.02",
        }}
      >
        <CharacterStage artUrl={artUrl} />
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded-full bg-white/92 px-2 py-0.5 text-[9px] font-bold text-black shadow">
          {theme.age} • {theme.playfulness}
        </div>
        <FrameIconRail motif={theme.motif} />
      </div>

      {/* Attacks */}
      <div
        className="relative z-10 mx-1 mt-2 flex flex-1 flex-col justify-center gap-1 rounded-md border border-black/5 px-2 py-1.5"
        style={{ background: theme.panel }}
      >
        {theme.attacks.map((atk, i) => (
          <div key={atk.name}>
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full text-[10px] font-black text-white shadow"
                style={{ background: theme.accentDeep }}
              >
                {atk.cost}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="flex-1 text-[13px] font-black leading-tight"
                    style={{ color: isDark ? "#fff" : theme.accentDeep }}
                  >
                    {atk.name}
                  </span>
                  <span
                    className="text-[17px] font-black tabular-nums"
                    style={{ color: isDark ? "#fff" : "#111" }}
                  >
                    {atk.damage}
                  </span>
                </div>
                <p
                  className="mt-0.5 text-[9.5px] leading-snug"
                  style={{ color: isDark ? "#c9d6ff" : "#333" }}
                >
                  {atk.description}
                </p>
              </div>
            </div>
            {i === 0 && (
              <div
                className="my-1 flex items-center justify-center gap-1 text-[8px] opacity-55"
                style={{ color: isDark ? "#fff" : theme.accentDeep }}
              >
                ★ ★ ★ ★ ★
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div
        className="relative z-10 mx-1 mt-1.5 grid grid-cols-3 gap-1 rounded-sm px-1.5 py-1 text-[9px] font-bold"
        style={{ background: theme.accentDeep, color: "#fff" }}
      >
        <div className="flex items-center gap-1">
          <span className="opacity-65">Weak</span>
          <MotifIcon motif={theme.motif} size={10} />
          <span>{theme.weakness}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="opacity-65">Resist</span>
          <span>{theme.resistance}</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="opacity-65">Retreat</span>
          <FriendBadge size={10} />
          <span>{theme.retreat}</span>
        </div>
      </div>

      {/* Flavor */}
      <p
        className="relative z-10 mx-1 mt-1 rounded-sm px-1.5 py-1 text-[9px] italic leading-snug"
        style={{
          background: isDark ? "#061433" : theme.accentSoft,
          color: isDark ? "#dce6ff" : theme.accentDeep,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
        }}
      >
        “{theme.flavor}”
      </p>

      <footer className="relative z-10 mt-1 px-1.5 pb-2.5 text-[7.5px] font-semibold tracking-wide opacity-80">
        Card No. {theme.cardNo} • Custom Card • © DANA &amp; FRIENDS 2026 • Play
        Set
      </footer>

      <HazardCorners accent={theme.accent} />
    </article>
  );
}

function cardFaceGradient(theme: Theme) {
  if (theme.id === "ritsuki") {
    return `radial-gradient(circle at 50% 0%, #2a5fd4 0%, ${theme.accentDeep} 55%, #020814 100%)`;
  }
  return `linear-gradient(165deg, ${theme.accentSoft} 0%, ${theme.accent} 42%, ${theme.border} 100%)`;
}

function nameStyle(theme: Theme, isDark: boolean): CSSProperties {
  if (isDark) {
    return {
      color: "#fff",
      WebkitTextStroke: `2px ${theme.accent}`,
      paintOrder: "stroke fill",
      textShadow: `0 0 10px ${theme.accent}, 2px 2px 0 #020814`,
    };
  }
  if (theme.id === "josephine") {
    return {
      background: "linear-gradient(#fff,#FF7AB8)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      WebkitTextStroke: `2.5px ${theme.accentDeep}`,
      paintOrder: "stroke fill",
      filter: "drop-shadow(2px 2px 0 rgba(0,0,0,.15))",
    };
  }
  return {
    color: theme.accentDeep,
    WebkitTextStroke: "2.5px #fff",
    paintOrder: "stroke fill",
    textShadow: `3px 3px 0 ${theme.accent}, 1px 1px 0 rgba(0,0,0,.25)`,
  };
}

function CornerScrews() {
  const pos = [
    "left-1.5 top-1.5",
    "right-1.5 top-1.5",
    "bottom-4 left-1.5",
    "bottom-4 right-1.5",
  ];
  return (
    <>
      {pos.map((p) => (
        <span
          key={p}
          className={`pointer-events-none absolute z-20 h-3 w-3 rounded-full border border-black/40 bg-[radial-gradient(circle_at_30%_30%,#fff,#d0d0d0_55%,#777)] shadow ${p}`}
        />
      ))}
    </>
  );
}

function BorderMotifStrip({ motif }: { motif: Theme["motif"] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[15px] opacity-90">
      <div className="absolute left-1 top-8 flex flex-col gap-3 text-black/40">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={`l${i}`} className="block">
            {i % 2 === 0 ? <MotifIcon motif={motif} size={11} /> : <FriendBadge size={11} />}
          </span>
        ))}
      </div>
      <div className="absolute right-1 top-8 flex flex-col gap-3 text-black/40">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={`r${i}`} className="block">
            {i % 2 === 0 ? <FriendBadge size={11} /> : <MotifIcon motif={motif} size={11} />}
          </span>
        ))}
      </div>
    </div>
  );
}

function FrameIconRail({ motif }: { motif: Theme["motif"] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <span className="absolute left-1 top-1 drop-shadow">
        <MotifIcon motif={motif} size={13} />
      </span>
      <span className="absolute right-1 top-1 drop-shadow">
        <FriendBadge size={13} />
      </span>
      <span className="absolute bottom-1 right-1 drop-shadow">
        <MotifIcon motif={motif} size={13} />
      </span>
      <span className="absolute bottom-1 left-[42%] drop-shadow">
        <FriendBadge size={11} />
      </span>
    </div>
  );
}

function HazardCorners({ accent }: { accent: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-[14px]"
      style={{
        background: `repeating-linear-gradient(135deg, #111 0 9px, ${accent} 9px 18px)`,
        clipPath:
          "polygon(0 0, 18% 0, 18% 100%, 0 100%, 0 0, 82% 0, 100% 0, 100% 100%, 82% 100%, 82% 0)",
      }}
    />
  );
}
