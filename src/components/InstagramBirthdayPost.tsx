"use client";

import type { RefObject } from "react";
import { CardFront, type CardData } from "@/components/CardFront";
import { MotifIcon } from "@/components/MotifIcon";
import { INSTAGRAM_SQUARE_PX } from "@/lib/exportCard";

const CARD_W = 500;
const CARD_H = Math.round((CARD_W * 88) / 63);

const CONFETTI: { x: number; y: number; s: number; c: string; round: boolean }[] = [
  { x: 46, y: 58, s: 18, c: "#FF7AB8", round: true },
  { x: 86, y: 118, s: 12, c: "#2F6BFF", round: false },
  { x: 154, y: 72, s: 10, c: "#FFE56A", round: true },
  { x: 210, y: 46, s: 14, c: "#FF9AC8", round: false },
  { x: 980, y: 64, s: 20, c: "#FFE56A", round: true },
  { x: 930, y: 120, s: 12, c: "#2F6BFF", round: true },
  { x: 1012, y: 150, s: 16, c: "#FF7AB8", round: false },
  { x: 58, y: 420, s: 16, c: "#FF7AB8", round: false },
  { x: 108, y: 560, s: 22, c: "#2F6BFF", round: true },
  { x: 48, y: 720, s: 12, c: "#FFE56A", round: true },
  { x: 140, y: 840, s: 14, c: "#FF9AC8", round: false },
  { x: 990, y: 400, s: 18, c: "#FFE56A", round: false },
  { x: 940, y: 560, s: 14, c: "#FF7AB8", round: true },
  { x: 1018, y: 700, s: 20, c: "#2F6BFF", round: true },
  { x: 960, y: 860, s: 12, c: "#FFE56A", round: false },
  { x: 70, y: 1004, s: 14, c: "#FF7AB8", round: true },
  { x: 990, y: 1008, s: 16, c: "#2F6BFF", round: false },
];

/**
 * 1080×1080 birthday post. The live card front sits in a party frame;
 * it is not the whole canvas.
 */
export function InstagramBirthdayPost({
  data,
  postRef,
}: {
  data: CardData;
  postRef: RefObject<HTMLDivElement | null>;
}) {
  const theme = data.theme;
  const dark = theme.id === "aura";
  const ink = dark ? "#FFF8EF" : theme.accentDeep;
  const friend = (data.customName || "Friend").trim() || "Friend";
  const cardLeft = Math.round((INSTAGRAM_SQUARE_PX - CARD_W) / 2);
  const cardTop = 248;

  return (
    <div
      ref={postRef}
      data-instagram-post="1"
      style={{
        width: INSTAGRAM_SQUARE_PX,
        height: INSTAGRAM_SQUARE_PX,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        color: ink,
        background: dark
          ? `radial-gradient(circle at 16% 8%, #5b8cff 0%, ${theme.accent} 22%, ${theme.accentDeep} 58%, #020814 100%)`
          : `radial-gradient(circle at 10% 0%, #fffef8 0%, ${theme.accentSoft} 24%, ${theme.accent} 62%, ${theme.headerFill} 100%)`,
        fontFamily: 'var(--font-body), "Nunito", sans-serif',
      }}
    >
      <div aria-hidden>
        {CONFETTI.map((bit) => (
          <span
            key={`${bit.x}-${bit.y}`}
            style={{
              position: "absolute",
              left: bit.x,
              top: bit.y,
              width: bit.s,
              height: bit.s,
              borderRadius: bit.round ? 999 : 3,
              background: bit.c,
              transform: bit.round ? undefined : "rotate(18deg)",
              boxShadow: "2px 2px 0 rgba(0,0,0,.18)",
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 36,
          border: `4px dashed ${dark ? "rgba(255,248,239,.55)" : theme.accentDeep}`,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 132,
          top: 292,
          width: 112,
          height: 112,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.accent,
          color: dark ? "#fff" : theme.accentDeep,
          border: `5px solid ${dark ? "#fff" : theme.accentDeep}`,
          boxShadow: "5px 5px 0 rgba(0,0,0,.2)",
          transform: "rotate(-8deg)",
          fontFamily: 'var(--font-display), "Fredoka", sans-serif',
          fontSize: 68,
          fontWeight: 700,
          lineHeight: "102px",
          textAlign: "center",
        }}
      >
        7
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 848,
          top: 318,
          width: 96,
          height: 96,
          borderRadius: 28,
          background: dark ? "#fff" : theme.accentSoft,
          border: `4px solid ${dark ? theme.accent : theme.accentDeep}`,
          boxShadow: "4px 4px 0 rgba(0,0,0,.18)",
          transform: "rotate(8deg)",
        }}
      >
        <span style={{ position: "absolute", left: 22, top: 18, lineHeight: 0 }}>
          <MotifIcon motif={theme.motif} size={52} />
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 52,
          left: 80,
          right: 80,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "0.18em",
            lineHeight: 1.1,
          }}
        >
          DANA &amp; FRIENDS
        </p>
        <h2
          className="font-display"
          style={{
            margin: "12px 0 0",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            textShadow: dark
              ? "-3px -3px 0 #2F6BFF, 3px -3px 0 #2F6BFF, -3px 3px 0 #2F6BFF, 3px 3px 0 #2F6BFF"
              : `-3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 3px 3px 0 #fff, 5px 5px 0 ${theme.accentDeep}`,
          }}
        >
          Dana’s 7th Birthday
        </h2>
      </div>

      <div
        style={{
          position: "absolute",
          left: cardLeft,
          top: cardTop,
          width: CARD_W,
          height: CARD_H,
          boxShadow: "8px 10px 0 rgba(0,0,0,.18)",
        }}
      >
        <CardFront data={data} />
      </div>

      <div
        style={{
          position: "absolute",
          top: cardTop + CARD_H + 18,
          left: 120,
          right: 120,
          textAlign: "center",
        }}
      >
        <p
          className="font-display"
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Bring {friend} to the party
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          A Dana &amp; Friends card · 7th birthday party
        </p>
      </div>
    </div>
  );
}
