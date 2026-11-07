"use client";

import { FriendBadge, MotifIcon } from "@/components/MotifIcon";
import { CharacterStage } from "@/components/CharacterStage";
import type { ArtPlan } from "@/lib/parts";
import type { Theme } from "@/lib/themes";

export type CardData = {
  theme: Theme;
  customName?: string;
  customHp?: number;
  artUrl: string;
  artBusy?: boolean;
  /** Parts-mixer composition plan (overlays). Omit for photo/Gemini results. */
  artPlan?: ArtPlan | null;
};

type Props = {
  data: CardData;
  className?: string;
};

/**
 * Card chrome matched to Dana/LOHA print fronts:
 * outlined name, type pill, face-safe art, full skill box (both attacks),
 * star divider, weakness bar, flavor + card-number footer — nothing clipped.
 */
export function CardFront({ data, className }: Props) {
  const { theme, artUrl, artPlan } = data;
  const name = (data.customName || theme.name).toUpperCase() || "FRIEND";
  const hp = data.customHp ?? theme.hp;
  const special = theme.special;
  const isDark = theme.id === "aura" && !special;
  const typeLabel = theme.playType;
  const nameClass = special ? `card-name--${special}` : `card-name--${theme.id}`;
  const face = specialFace(theme);
  const panelBg = special ? "#fffaf0" : theme.panel;
  const attackInk = isDark ? "#fff" : special === "gold" ? "#3a2a08" : special === "rainbow" ? "#241428" : theme.accentDeep;
  const bodyInk = isDark ? "#c9d6ff" : "#333";

  return (
    <article
      className={`card-front card-scaled relative aspect-[63/88] w-full ${className ?? ""}`}
      data-card-side="front"
      data-special={special || undefined}
    >
      {/*
        Type and padding are designed at 400px (studio width). This layer scales
        to the real card width so a 63.5mm sleeve keeps the same art share
        instead of letting the attack block crush the portrait to a hairline.
      */}
      <div
        className="card-scale relative flex flex-col overflow-hidden rounded-[22px] border-[7px] p-[7px] pb-[18px]"
        style={face}
      >
      <CornerScrews />
      <BorderMotifStrip motif={theme.motif} isDark={isDark} />
      <HazardCorners accent={theme.accent} />

      <header className="relative z-10 flex shrink-0 items-start justify-between gap-2 px-1 pt-0.5">
        <div className="min-w-0 space-y-0.5">
          <h2
            className={`card-name ${nameClass} text-[clamp(1.45rem,4.8vw,2rem)]`}
          >
            {name}
          </h2>
          <span
            className="inline-flex items-center gap-1 rounded-full border-2 px-2 py-[1px] text-[9px] font-extrabold shadow-sm"
            data-card-chrome="type-pill"
            style={{
              background: isDark ? theme.accentDeep : theme.accent,
              borderColor: theme.accentDeep,
              color: isDark ? "#fff" : theme.accentDeep,
            }}
          >
            <MotifIcon motif={theme.motif} size={10} />
            {typeLabel}
          </span>
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-1">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 shadow"
            data-card-chrome="type-icon"
            style={{
              background: theme.accentSoft,
              borderColor: theme.accentDeep,
            }}
          >
            <MotifIcon motif={theme.motif} size={14} />
          </span>
          <div
            className="rounded-full border-2 px-2 py-0.5 text-[12px] font-black tracking-wide"
            data-card-chrome="hp"
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

      {/*
        Art fills leftover space AFTER the lower half is laid out (shrink-0).
        Never shrink-0 a near-square art window — that ate ~70% of the card and
        clipped attack 2 / stats / footer under overflow-hidden.
      */}
      <div
        className="card-art-frame relative z-10 mx-0.5 mt-1 min-h-0 w-auto flex-1 overflow-hidden rounded-[8px] border-[3.5px]"
        style={{
          borderColor: theme.accentDeep,
          background: theme.artBg,
        }}
      >
        <CharacterStage artUrl={artUrl} artPlan={artPlan} />
        {data.artBusy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-3 text-center">
            <p className="rounded-xl bg-white/95 px-3 py-2 text-[11px] font-extrabold text-black shadow">
              Gemini stylizing…
            </p>
          </div>
        )}
        <div
          className="pointer-events-none absolute bottom-1 left-1 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold shadow"
          data-card-chrome="age"
          style={{
            background: isDark ? "rgba(6,20,51,.9)" : "rgba(255,255,255,.94)",
            color: isDark ? "#fff" : "#111",
          }}
        >
          {theme.age}
          {theme.playfulness ? ` · ${theme.playfulness}` : ""}
        </div>
        <span
          className="pointer-events-none absolute bottom-1 right-1 z-10 drop-shadow"
          data-card-chrome="motif"
        >
          <MotifIcon motif={theme.motif} size={14} />
        </span>
      </div>

      {/* Lower half — shrink-0 so both attacks + stats + flavor + meta always fit */}
      <div className="relative z-10 mx-0.5 mt-1.5 flex shrink-0 flex-col gap-1">
        <div
          className="flex flex-col gap-0.5 rounded-md border border-black/5 px-1.5 py-1"
          style={{ background: panelBg }}
        >
          {theme.attacks.map((atk, i) => (
            <div key={`${atk.name}-${i}`}>
              <div className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 shrink-0 rounded-full px-1.5 py-[2px] text-[8px] font-black tracking-wide text-white shadow"
                  data-card-chrome="attack"
                  style={{
                    background: isDark ? theme.accent : theme.accentDeep,
                  }}
                >
                  Attack {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="card-attack-name flex-1 text-[12px] leading-tight"
                      style={{ color: attackInk }}
                    >
                      {atk.name}
                    </span>
                    <span
                      className="font-display text-[15px] font-bold tabular-nums"
                      style={{
                        color: isDark ? "#A8C4FF" : attackInk,
                      }}
                    >
                      {atk.damage}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 text-[8.5px] leading-snug"
                    style={{ color: bodyInk }}
                  >
                    {atk.description}
                  </p>
                </div>
              </div>
              {i === 0 && (
                <div
                  className="my-0.5 flex items-center justify-center text-[7px] tracking-[0.2em] opacity-50"
                  style={{ color: isDark ? "#A8C4FF" : theme.accentDeep }}
                >
                  ★ ★ ★ ★ ★
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-3 gap-0.5 rounded-sm border px-1.5 py-0.5 text-[8px] font-bold"
          style={{
            background: special ? "#fffaf0" : isDark ? "#061433" : theme.accentSoft,
            borderColor: special === "gold" ? "#8a6414" : special === "rainbow" ? "#5c3d78" : theme.accentDeep,
            color: isDark ? "#fff" : attackInk,
          }}
        >
          <div className="flex items-center gap-0.5">
            <span className="opacity-65">Weak</span>
            <MotifIcon motif={theme.motif} size={9} />
            <span>{theme.weakness}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5">
            <span className="opacity-65">Resist</span>
            <span>{theme.resistance}</span>
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <span className="opacity-65">Retreat</span>
            <FriendBadge size={9} />
            <span>{theme.retreat}</span>
          </div>
        </div>

        <p
          className="rounded-sm px-1.5 py-0.5 text-[8px] italic leading-snug"
          style={{
            background: isDark ? theme.accentDeep : theme.accent,
            color: isDark ? "#dce6ff" : theme.accentDeep,
          }}
        >
          “{theme.flavor}”
        </p>

        <footer
          className="relative z-10 px-1 pb-0.5 pt-0.5 text-center text-[7px] font-semibold tracking-wide"
          style={{ color: isDark ? "#A8C4FF" : "#333", opacity: 0.9 }}
        >
          Card No. {theme.cardNo} • © DANA &amp; FRIENDS 2026 • LIMITED Edition
        </footer>
      </div>
      </div>
    </article>
  );
}

function specialFace(theme: Theme): {
  background: string;
  borderColor: string;
  color: string;
} {
  if (theme.special === "gold") {
    return {
      background:
        "linear-gradient(165deg, #fff8d2 0%, #f6d56a 30%, #e2b03a 58%, #fff4b8 80%, #c9922a 100%)",
      borderColor: "#8a6414",
      color: "#3a2a08",
    };
  }
  if (theme.special === "rainbow") {
    return {
      background:
        "linear-gradient(#fffdf8, #fff7fb) padding-box, linear-gradient(135deg, #ff7ab8, #ffe56a, #7dffa0, #7eb6ff, #d7b0ff) border-box",
      borderColor: "transparent",
      color: "#241428",
    };
  }
  if (theme.id === "aura") {
    return {
      background: `radial-gradient(circle at 50% 0%, #2a5fd4 0%, ${theme.accentDeep} 55%, #020814 100%)`,
      borderColor: theme.border,
      color: theme.text,
    };
  }
  return {
    background: `linear-gradient(165deg, ${theme.accentSoft} 0%, ${theme.accent} 42%, ${theme.border} 100%)`,
    borderColor: theme.border,
    color: theme.text,
  };
}

function CornerScrews() {
  const pos = [
    "left-1.5 top-1.5",
    "right-1.5 top-1.5",
    "bottom-2 left-1.5",
    "bottom-2 right-1.5",
  ];
  return (
    <>
      {pos.map((p) => (
        <span
          key={p}
          className={`pointer-events-none absolute z-30 h-2.5 w-2.5 rounded-full border border-black/40 bg-[radial-gradient(circle_at_30%_30%,#fff,#d0d0d0_55%,#777)] shadow ${p}`}
          data-card-chrome="screw"
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
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[15px] ${isDark ? "opacity-70" : "opacity-80"}`}
    >
      <div className="absolute left-1 top-9 flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={`l${i}`} className="block">
            {i % 2 === 0 ? (
              <MotifIcon motif={motif} size={11} />
            ) : (
              <FriendBadge size={10} />
            )}
          </span>
        ))}
      </div>
      <div className="absolute right-1 top-9 flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={`r${i}`} className="block">
            {i % 2 === 0 ? (
              <FriendBadge size={10} />
            ) : (
              <MotifIcon motif={motif} size={11} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Tiny corner hazard only — cleared by article pb so it never covers footer. */
function HazardCorners({ accent }: { accent: string }) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-[9px]"
      style={{
        background: `repeating-linear-gradient(135deg, #111 0 7px, ${accent} 7px 14px)`,
        clipPath:
          "polygon(0 0, 11% 0, 11% 100%, 0 100%, 0 0, 89% 0, 100% 0, 100% 100%, 89% 100%, 89% 0)",
      }}
      aria-hidden
    />
  );
}
