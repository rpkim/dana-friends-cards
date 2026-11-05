"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import { CharacterStage } from "@/components/CharacterStage";
import type { Theme } from "@/lib/themes";

export type CardData = {
  theme: Theme;
  customName?: string;
  customHp?: number;
  artUrl: string;
  artBusy?: boolean;
};

type Props = {
  data: CardData;
  className?: string;
};

/**
 * Card chrome modeled on the example set (Dana friends + LOHA snack/night):
 * outlined display name, type pill, art frame, Attack 1/2 pills, themed stats.
 */
export function CardFront({ data, className }: Props) {
  const { theme, artUrl } = data;
  const name = (data.customName || theme.name).toUpperCase() || "FRIEND";
  const hp = data.customHp ?? theme.hp;
  const isDark = theme.id === "aura";
  const typeLabel = theme.playType;

  return (
    <article
      className={`card-front relative flex aspect-[63/88] w-full flex-col overflow-hidden rounded-[22px] border-[7px] p-[8px] shadow-[0_12px_28px_rgba(0,0,0,.28)] ${className ?? ""}`}
      style={{
        background: cardFaceGradient(theme),
        borderColor: theme.border,
        color: theme.text,
      }}
      data-card-side="front"
    >
      <CornerScrews />
      <BorderMotifStrip motif={theme.motif} isDark={isDark} />

      <header className="relative z-10 flex items-start justify-between gap-2 px-1 pt-0.5">
        <div className="min-w-0 space-y-1">
          <h2 className={`card-name card-name--${theme.id} text-[clamp(1.65rem,5.4vw,2.2rem)]`}>
            {name}
          </h2>
          <span
            className="inline-flex items-center gap-1 rounded-full border-2 px-2 py-[2px] text-[10px] font-extrabold shadow-sm"
            style={{
              background: isDark ? theme.accentDeep : theme.accent,
              borderColor: theme.accentDeep,
              color: isDark ? "#fff" : theme.accentDeep,
            }}
          >
            <MotifIcon motif={theme.motif} size={11} />
            {typeLabel}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 shadow"
            style={{
              background: theme.accentSoft,
              borderColor: theme.accentDeep,
            }}
          >
            <MotifIcon motif={theme.motif} size={16} />
          </span>
          <div
            className="rounded-full border-2 px-2.5 py-0.5 text-[13px] font-black tracking-wide"
            style={{
              background: isDark ? theme.accentDeep : "#fffef6",
              borderColor: isDark ? "#fff" : theme.accentDeep,
              color: isDark ? "#fff" : theme.accentDeep,
            }}
          >
            <span className="opacity-70">HP</span> {hp}
          </div>
        </div>
      </header>

      <div
        className="card-art-frame relative z-10 mx-0.5 mt-1.5 shrink-0 overflow-hidden rounded-[8px] border-[3.5px]"
        style={{
          borderColor: theme.accentDeep,
          background: theme.artBg,
          /*
           * Near-square like Dana/LOHA examples. Must use shrink-0 — otherwise the
           * card flex column crushes this below its aspect-ratio (~1.66 landscape)
           * and object-cover chops faces mid-nose / chin.
           */
          aspectRatio: "1.08 / 1",
        }}
      >
        <CharacterStage artUrl={artUrl} />
        {data.artBusy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-3 text-center">
            <p className="rounded-xl bg-white/95 px-3 py-2 text-[11px] font-extrabold text-black shadow">
              Gemini stylizing…
              <span className="mt-0.5 block text-[10px] font-semibold opacity-70">
                변환 중…
              </span>
            </p>
          </div>
        )}
        <div
          className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold shadow"
          style={{
            background: isDark ? "rgba(6,20,51,.9)" : "rgba(255,255,255,.94)",
            color: isDark ? "#fff" : "#111",
          }}
        >
          {theme.age}
          {theme.playfulness ? ` · ${theme.playfulness}` : ""}
        </div>
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 drop-shadow">
          <MotifIcon motif={theme.motif} size={16} />
        </span>
      </div>

      <div
        className="relative z-10 mx-0.5 mt-1.5 flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden rounded-md px-2 py-1"
        style={{ background: theme.panel }}
      >
        {theme.attacks.map((atk, i) => (
          <div key={`${atk.name}-${i}`}>
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white shadow"
                style={{ background: isDark ? theme.accent : theme.accentDeep }}
              >
                Attack {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="card-attack-name flex-1 text-[14px] leading-tight"
                    style={{ color: isDark ? "#fff" : theme.accentDeep }}
                  >
                    {atk.name}
                  </span>
                  <span
                    className="font-display text-[18px] font-bold tabular-nums"
                    style={{ color: isDark ? "#A8C4FF" : theme.accentDeep }}
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
                className="my-1 flex items-center justify-center gap-1.5 opacity-70"
                style={{ color: isDark ? "#A8C4FF" : theme.accentDeep }}
              >
                <MotifIcon motif={theme.motif} size={9} />
                <span className="text-[8px]">● ● ●</span>
                <MotifIcon motif={theme.motif} size={9} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="relative z-10 mx-0.5 mt-1.5 grid grid-cols-3 gap-1 rounded-sm border px-1.5 py-1 text-[9px] font-bold"
        style={{
          background: isDark ? "#061433" : theme.accentSoft,
          borderColor: theme.accentDeep,
          color: isDark ? "#fff" : theme.accentDeep,
        }}
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

      <p
        className="relative z-10 mx-0.5 mt-1 rounded-sm px-1.5 py-1 text-[9px] italic leading-snug"
        style={{
          background: isDark ? theme.accentDeep : theme.accent,
          color: isDark ? "#dce6ff" : theme.accentDeep,
        }}
      >
        “{theme.flavor}”
      </p>

      <footer
        className="relative z-10 mt-1 px-1 pb-2.5 text-[7.5px] font-semibold tracking-wide"
        style={{ color: isDark ? "#A8C4FF" : "#333", opacity: 0.85 }}
      >
        Card No. {theme.cardNo} • Custom Card • © DANA &amp; FRIENDS 2026 • Play
        Set
      </footer>

      <HazardCorners accent={theme.accent} />
    </article>
  );
}

function cardFaceGradient(theme: Theme) {
  if (theme.id === "aura") {
    return `radial-gradient(circle at 50% 0%, #2a5fd4 0%, ${theme.accentDeep} 55%, #020814 100%)`;
  }
  return `linear-gradient(165deg, ${theme.accentSoft} 0%, ${theme.accent} 42%, ${theme.border} 100%)`;
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

function BorderMotifStrip({
  motif,
  isDark,
}: {
  motif: Theme["motif"];
  isDark: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[15px] ${isDark ? "opacity-80" : "opacity-90"}`}
    >
      <div className="absolute left-1 top-10 flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={`l${i}`} className="block">
            {i % 2 === 0 ? (
              <MotifIcon motif={motif} size={12} />
            ) : (
              <FriendBadge size={11} />
            )}
          </span>
        ))}
      </div>
      <div className="absolute right-1 top-10 flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={`r${i}`} className="block">
            {i % 2 === 0 ? (
              <FriendBadge size={11} />
            ) : (
              <MotifIcon motif={motif} size={12} />
            )}
          </span>
        ))}
      </div>
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
