"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import { CharacterStage } from "@/components/CharacterStage";
import type { PartsSelection } from "@/lib/parts";
import type { Theme } from "@/lib/themes";

export type CardData = {
  theme: Theme;
  customName?: string;
  customHp?: number;
  parts: PartsSelection;
  photoUrl?: string | null;
};

type Props = {
  data: CardData;
  className?: string;
};

export function CardFront({ data, className }: Props) {
  const { theme, parts, photoUrl } = data;
  const name = (data.customName || theme.name).toUpperCase();
  const hp = data.customHp ?? theme.hp;
  const isDark = theme.id === "ritsuki";

  return (
    <article
      className={`card-front relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[18px] border-[6px] p-2 shadow-xl ${className ?? ""}`}
      style={{
        background: `linear-gradient(160deg, ${theme.accentSoft}, ${theme.accent} 45%, ${theme.border})`,
        borderColor: theme.border,
        color: theme.text,
      }}
      data-card-side="front"
    >
      <BorderDecor motif={theme.motif} accent={theme.accentDeep} />

      <header className="relative z-10 mb-1 flex items-start justify-between gap-2 px-1 pt-1">
        <h2
          className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,4.5vw,1.85rem)] font-black leading-none tracking-wide"
          style={{
            color: isDark ? "#fff" : theme.accentDeep,
            textShadow: isDark
              ? `0 0 8px ${theme.accent}, 2px 2px 0 ${theme.accentDeep}`
              : `2px 2px 0 #fff, 3px 3px 0 ${theme.accent}`,
          }}
        >
          {name}
        </h2>
        <div className="flex items-center gap-1">
          <MotifIcon motif={theme.motif} size={18} className="text-yellow-300" />
          <div
            className="rounded-full px-2.5 py-0.5 text-sm font-black"
            style={{
              background: isDark ? theme.accent : "#fff",
              color: isDark ? "#fff" : "#111",
              boxShadow: "0 1px 0 rgba(0,0,0,.25)",
            }}
          >
            HP {hp}
          </div>
        </div>
      </header>

      <div className="relative z-10 mb-1 flex items-center gap-1 px-1">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: isDark ? "#fff8" : "#fff",
            color: theme.accentDeep,
          }}
        >
          <MotifIcon motif={theme.motif} size={10} />
          {theme.playType}
        </span>
      </div>

      <div
        className="relative z-10 mx-1 overflow-hidden rounded-md border-[3px]"
        style={{
          borderColor: "#1a1a1a",
          background: theme.artBg,
          aspectRatio: "1 / 1.05",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-1 pt-1">
          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Art Frame
          </span>
        </div>
        <CharacterStage parts={parts} photoUrl={photoUrl} />
        <div className="pointer-events-none absolute bottom-1 left-1 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-black">
          {theme.age} • {theme.playfulness}
        </div>
        <ArtFrameDecor motif={theme.motif} />
      </div>

      <div
        className="relative z-10 mx-1 mt-2 flex flex-1 flex-col gap-1.5 rounded-md px-2 py-1.5"
        style={{ background: theme.panel }}
      >
        {theme.attacks.map((atk, i) => (
          <div key={atk.name} className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ background: theme.accentDeep }}
              >
                {atk.cost}
              </span>
              <span style={{ color: theme.accent }} className="opacity-90">
                <MotifIcon motif={theme.motif} size={14} />
              </span>
              <span className="flex-1 text-sm font-extrabold" style={{ color: isDark ? "#fff" : theme.accentDeep }}>
                {atk.name}
              </span>
              <span className="text-base font-black" style={{ color: isDark ? "#fff" : "#111" }}>
                {atk.damage}
              </span>
            </div>
            <p
              className="pl-7 text-[10px] leading-snug"
              style={{ color: isDark ? "#c9d6ff" : "#333" }}
            >
              {atk.description}
            </p>
            {i === 0 && (
              <div className="flex justify-center gap-1 py-0.5 text-[8px] opacity-60">
                ★ ★ ★
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="relative z-10 mx-1 mt-1.5 grid grid-cols-3 gap-1 rounded px-1 py-1 text-[9px] font-bold"
        style={{
          background: theme.accentDeep,
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-1">
          <span className="opacity-70">Weak</span>
          <MotifIcon motif={theme.motif} size={10} />
          <span>{theme.weakness}</span>
        </div>
        <div className="flex items-center gap-1 justify-center">
          <span className="opacity-70">Resist</span>
          <span>{theme.resistance}</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <span className="opacity-70">Retreat</span>
          <FriendBadge size={10} />
          <span>{theme.retreat}</span>
        </div>
      </div>

      <p
        className="relative z-10 mx-1 mt-1 rounded px-1.5 py-1 text-[9px] italic leading-snug"
        style={{
          background: isDark ? "#061433" : theme.accentSoft,
          color: isDark ? "#dce6ff" : theme.accentDeep,
        }}
      >
        “{theme.flavor}”
      </p>

      <footer className="relative z-10 mt-1 flex items-end justify-between px-1 pb-0.5 text-[8px] font-semibold opacity-80">
        <span>
          Card No. {theme.cardNo} • Custom Card • © DANA &amp; FRIENDS 2026 • Play
          Set
        </span>
      </footer>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 opacity-90"
        style={{
          background: `repeating-linear-gradient(135deg, #111 0 8px, ${theme.accent} 8px 16px)`,
        }}
      />
    </article>
  );
}

function BorderDecor({
  motif,
  accent,
}: {
  motif: Theme["motif"];
  accent: string;
}) {
  const spots = [
    "top-2 left-2",
    "top-2 right-2",
    "bottom-5 left-2",
    "bottom-5 right-2",
    "top-1/3 left-1",
    "top-1/3 right-1",
    "top-2/3 left-1",
    "top-2/3 right-1",
  ];
  return (
    <>
      {spots.map((pos) => (
        <span
          key={pos}
          className={`pointer-events-none absolute z-0 ${pos}`}
          style={{ color: accent }}
        >
          <MotifIcon motif={motif} size={12} />
        </span>
      ))}
    </>
  );
}

function ArtFrameDecor({ motif }: { motif: Theme["motif"] }) {
  return (
    <div className="pointer-events-none absolute inset-0 border border-white/30">
      <div className="absolute left-1 top-1 text-yellow-300">
        <MotifIcon motif={motif} size={12} />
      </div>
      <div className="absolute right-1 top-1 text-yellow-300">
        <FriendBadge size={12} />
      </div>
      <div className="absolute bottom-1 right-1 text-yellow-300">
        <MotifIcon motif={motif} size={12} />
      </div>
    </div>
  );
}
