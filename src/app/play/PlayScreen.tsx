"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { listSavedCards, type SavedCard } from "@/lib/cardLibrary";
import { themeFromDraft } from "@/lib/cardModel";

const ADVANCE_MS = 5000;
const SLIDE_MS = 900;
const CURSOR_IDLE_MS = 2200;
const LOOK_SHUFFLE_MS = 6000;
const PLAY_LOOK_KEY = "dana-play-look";
const PLAY_LOOK_SHUFFLE = "shuffle";

type PlayLook =
  | "night"
  | "party"
  | "studio"
  | "candy"
  | "meadow"
  | "starlight"
  | "gold"
  | "bubble"
  | "aurora";

const PLAY_LOOKS: readonly PlayLook[] = [
  "night",
  "party",
  "studio",
  "candy",
  "meadow",
  "starlight",
  "gold",
  "bubble",
  "aurora",
];

type DecorBit = { x: string; y: string; s: number; c: string; round: boolean };

const PARTY_CONFETTI: DecorBit[] = [
  { x: "4%", y: "7%", s: 18, c: "#FF7AB8", round: true },
  { x: "9%", y: "16%", s: 12, c: "#7EB6FF", round: false },
  { x: "15%", y: "6%", s: 10, c: "#FFE56A", round: true },
  { x: "86%", y: "5%", s: 20, c: "#FFE56A", round: true },
  { x: "80%", y: "14%", s: 12, c: "#7EB6FF", round: true },
  { x: "93%", y: "15%", s: 16, c: "#FF7AB8", round: false },
  { x: "3%", y: "40%", s: 16, c: "#FF7AB8", round: false },
  { x: "8%", y: "56%", s: 22, c: "#7EB6FF", round: true },
  { x: "4%", y: "74%", s: 12, c: "#FFE56A", round: true },
  { x: "13%", y: "88%", s: 14, c: "#FF9AC8", round: false },
  { x: "91%", y: "38%", s: 18, c: "#FFE56A", round: false },
  { x: "84%", y: "54%", s: 14, c: "#FF7AB8", round: true },
  { x: "94%", y: "68%", s: 20, c: "#7EB6FF", round: true },
  { x: "86%", y: "84%", s: 12, c: "#FFE56A", round: false },
  { x: "6%", y: "93%", s: 14, c: "#FF7AB8", round: true },
  { x: "92%", y: "93%", s: 16, c: "#7EB6FF", round: false },
];

const CANDY_SPRINKLES: DecorBit[] = [
  { x: "6%", y: "18%", s: 14, c: "#FF7AB8", round: false },
  { x: "12%", y: "8%", s: 10, c: "#FFE56A", round: true },
  { x: "18%", y: "22%", s: 8, c: "#FF9A6A", round: true },
  { x: "88%", y: "10%", s: 16, c: "#FF7AB8", round: true },
  { x: "80%", y: "18%", s: 11, c: "#FFF", round: false },
  { x: "93%", y: "28%", s: 9, c: "#FFE56A", round: true },
  { x: "4%", y: "62%", s: 12, c: "#FFB3D0", round: true },
  { x: "10%", y: "84%", s: 15, c: "#FF7AB8", round: false },
  { x: "90%", y: "72%", s: 13, c: "#FFE56A", round: false },
  { x: "84%", y: "88%", s: 10, c: "#FF9A6A", round: true },
];

const MEADOW_DOTS: DecorBit[] = [
  { x: "7%", y: "16%", s: 16, c: "#7DCEA0", round: true },
  { x: "14%", y: "8%", s: 10, c: "#FFE56A", round: true },
  { x: "4%", y: "48%", s: 12, c: "#B7E4C7", round: true },
  { x: "9%", y: "78%", s: 18, c: "#7DCEA0", round: true },
  { x: "86%", y: "22%", s: 14, c: "#FFE56A", round: true },
  { x: "92%", y: "40%", s: 11, c: "#7DCEA0", round: true },
  { x: "80%", y: "84%", s: 16, c: "#B7E4C7", round: true },
  { x: "93%", y: "90%", s: 9, c: "#FFE56A", round: true },
];

const STARLIGHT_STARS: DecorBit[] = [
  { x: "8%", y: "12%", s: 6, c: "#FFF8EF", round: true },
  { x: "16%", y: "22%", s: 4, c: "#FFE56A", round: true },
  { x: "6%", y: "38%", s: 8, c: "#FFF8EF", round: true },
  { x: "12%", y: "58%", s: 4, c: "#FFF8EF", round: true },
  { x: "5%", y: "76%", s: 6, c: "#FFE56A", round: true },
  { x: "18%", y: "88%", s: 5, c: "#FFF8EF", round: true },
  { x: "78%", y: "8%", s: 5, c: "#FFF8EF", round: true },
  { x: "88%", y: "16%", s: 8, c: "#FFE56A", round: true },
  { x: "94%", y: "30%", s: 4, c: "#FFF8EF", round: true },
  { x: "82%", y: "46%", s: 6, c: "#FFF8EF", round: true },
  { x: "91%", y: "62%", s: 4, c: "#FFE56A", round: true },
  { x: "86%", y: "80%", s: 7, c: "#FFF8EF", round: true },
  { x: "94%", y: "90%", s: 5, c: "#FFF8EF", round: true },
  { x: "28%", y: "10%", s: 4, c: "#FFF8EF", round: true },
  { x: "70%", y: "92%", s: 4, c: "#FFE56A", round: true },
];

const GOLD_FLECKS: DecorBit[] = [
  { x: "8%", y: "20%", s: 10, c: "#FFE56A", round: false },
  { x: "14%", y: "10%", s: 7, c: "#FFF1B8", round: true },
  { x: "5%", y: "46%", s: 12, c: "#E6C35C", round: false },
  { x: "11%", y: "72%", s: 8, c: "#FFE56A", round: true },
  { x: "18%", y: "88%", s: 6, c: "#FFF1B8", round: false },
  { x: "84%", y: "12%", s: 11, c: "#FFE56A", round: false },
  { x: "92%", y: "24%", s: 7, c: "#FFF1B8", round: true },
  { x: "80%", y: "58%", s: 9, c: "#E6C35C", round: false },
  { x: "90%", y: "78%", s: 13, c: "#FFE56A", round: true },
  { x: "76%", y: "90%", s: 6, c: "#FFF1B8", round: false },
];

const BUBBLES: DecorBit[] = [
  { x: "2%", y: "18%", s: 120, c: "rgba(255,255,255,0.55)", round: true },
  { x: "8%", y: "70%", s: 78, c: "rgba(255,182,220,0.45)", round: true },
  { x: "78%", y: "6%", s: 96, c: "rgba(210,180,255,0.5)", round: true },
  { x: "86%", y: "42%", s: 150, c: "rgba(255,255,255,0.38)", round: true },
  { x: "72%", y: "78%", s: 70, c: "rgba(255,194,226,0.5)", round: true },
  { x: "40%", y: "4%", s: 54, c: "rgba(255,255,255,0.45)", round: true },
];

const LOOK_BY_DIGIT: Record<string, PlayLook> = {
  "1": "night",
  "2": "party",
  "3": "studio",
  "4": "candy",
  "5": "meadow",
  "6": "starlight",
  "7": "gold",
  "8": "bubble",
  "9": "aurora",
};

const DECOR: Partial<Record<PlayLook, { kind: string; bits: DecorBit[]; frame?: boolean }>> = {
  party: { kind: "confetti", bits: PARTY_CONFETTI, frame: true },
  candy: { kind: "sprinkle", bits: CANDY_SPRINKLES },
  meadow: { kind: "sprinkle", bits: MEADOW_DOTS },
  starlight: { kind: "star", bits: STARLIGHT_STARS },
  gold: { kind: "fleck", bits: GOLD_FLECKS },
  bubble: { kind: "bubble", bits: BUBBLES },
};

function keyDigit(code: string): string {
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return code.slice(6);
  return "";
}

function randomLook(except?: PlayLook): PlayLook {
  const choices = except ? PLAY_LOOKS.filter((item) => item !== except) : PLAY_LOOKS;
  return choices[Math.floor(Math.random() * choices.length)] ?? "night";
}

function readStoredLook(): { look: PlayLook; shuffle: boolean } | null {
  try {
    const stored = sessionStorage.getItem(PLAY_LOOK_KEY);
    if (stored === PLAY_LOOK_SHUFFLE) return { look: randomLook(), shuffle: true };
    if (stored && (PLAY_LOOKS as readonly string[]).includes(stored)) {
      return { look: stored as PlayLook, shuffle: false };
    }
  } catch {
    /* private mode */
  }
  return null;
}

function storeLook(value: string) {
  try {
    sessionStorage.setItem(PLAY_LOOK_KEY, value);
  } catch {
    /* private mode */
  }
}

function cardData(card: SavedCard): CardData {
  return {
    theme: themeFromDraft(card.draft),
    artUrl: card.portraitUrl,
    customName: card.draft.name || card.name,
    customHp: card.draft.hp,
  };
}

function cardLabel(card: SavedCard): string {
  const label = (card.name || card.draft.name).trim();
  return label || "Friend";
}

function PlayDecor({ look }: { look: PlayLook }) {
  const decor = DECOR[look];
  if (!decor) return null;
  return (
    <div className={`play-party-decor play-decor-${decor.kind}`} aria-hidden>
      {decor.bits.map((bit) => (
        <span
          key={`${bit.x}-${bit.y}`}
          style={{
            left: bit.x,
            top: bit.y,
            width: bit.s,
            height: bit.s,
            borderRadius: bit.round ? 999 : 4,
            background: bit.c,
            transform: bit.round ? undefined : "rotate(18deg)",
          }}
        />
      ))}
      {decor.frame ? <div className="play-party-frame" /> : null}
    </div>
  );
}

function CardPair({ card }: { card: SavedCard }) {
  const data = cardData(card);
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-[clamp(16px,2.2vw,40px)] px-[2vw] pt-[14vh] pb-[11vh]"
      data-play-id={card.id}
      data-play-label={cardLabel(card)}
    >
      <div className="w-[min(34vw,calc(72vh*63/88))] shrink-0">
        <CardFront data={data} />
      </div>
      <div className="w-[min(34vw,calc(72vh*63/88))] shrink-0">
        <CardBack theme={data.theme} />
      </div>
    </div>
  );
}

export function PlayScreen() {
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"rest" | "slide">("rest");
  const [hideCursor, setHideCursor] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [look, setLook] = useState<PlayLook>("night");
  const [shuffleLooks, setShuffleLooks] = useState(false);
  const [shuffleEpoch, setShuffleEpoch] = useState(0);
  const [navTick, setNavTick] = useState(0);
  const lengthRef = useRef(0);
  const phaseRef = useRef(phase);
  const committedRef = useRef(false);
  const slideProgressRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const count = cards?.length ?? 0;
  lengthRef.current = count;
  phaseRef.current = phase;
  const safeIndex = count > 0 ? index % count : 0;
  const current = count > 0 && cards ? cards[safeIndex] : null;
  const upcoming = count > 1 && cards ? cards[(safeIndex + 1) % count] : null;
  const titleCard = phase === "slide" && upcoming ? upcoming : current;
  const status = cards === null ? "loading" : count === 0 ? "empty" : "ready";
  const playbackHeld = paused || pickerOpen;

  const finishSlide = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    slideProgressRef.current = 0;
    setIndex((currentIndex) => {
      const total = lengthRef.current;
      return total > 0 ? (currentIndex + 1) % total : 0;
    });
    setPhase("rest");
  }, []);

  const showFriend = useCallback((nextIndex: number) => {
    committedRef.current = true;
    slideProgressRef.current = 0;
    setIndex(nextIndex);
    setPhase("rest");
    setPaused(false);
    setPickerOpen(false);
    setNavTick((tick) => tick + 1);
  }, []);

  const stepFriend = useCallback((delta: number) => {
    const total = lengthRef.current;
    if (total < 2) return;
    committedRef.current = true;
    slideProgressRef.current = 0;
    setIndex((currentIndex) => (currentIndex + delta + total) % total);
    setPhase("rest");
    setPickerOpen(false);
    setNavTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSavedCards()
      .then((rows) => {
        if (!cancelled) setCards(rows);
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const stored = readStoredLook();
    if (!stored) return;
    setLook(stored.look);
    setShuffleLooks(stored.shuffle);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, []);

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHideCursor(true), CURSOR_IDLE_MS);
    };
    const wake = () => {
      setHideCursor(false);
      arm();
    };
    try {
      arm();
      window.addEventListener("mousemove", wake);
    } catch {
      return;
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (event.repeat) return;
        setPaused((value) => !value);
        return;
      }
      if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
        event.preventDefault();
        if (event.repeat) return;
        stepFriend(event.code === "ArrowRight" ? 1 : -1);
        return;
      }
      if (event.code === "Escape") setPickerOpen(false);
      const digit = keyDigit(event.code);
      if (digit === "0") {
        event.preventDefault();
        if (event.repeat) return;
        setShuffleLooks(true);
        setShuffleEpoch((epoch) => epoch + 1);
        setLook((current) => randomLook(current));
        storeLook(PLAY_LOOK_SHUFFLE);
        return;
      }
      const nextLook = LOOK_BY_DIGIT[digit];
      if (!nextLook) return;
      event.preventDefault();
      if (event.repeat) return;
      setShuffleLooks(false);
      setLook(nextLook);
      storeLook(nextLook);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepFriend]);

  useEffect(() => {
    if (!shuffleLooks) return;
    const id = window.setInterval(() => {
      setLook((current) => randomLook(current));
    }, LOOK_SHUFFLE_MS);
    return () => window.clearInterval(id);
  }, [shuffleLooks, shuffleEpoch]);

  useEffect(() => {
    if (!cards || cards.length < 2 || playbackHeld) return;
    const total = cards.length;
    const id = window.setInterval(() => {
      if (phaseRef.current === "slide") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIndex((currentIndex) => (currentIndex + 1) % total);
        return;
      }
      committedRef.current = false;
      slideProgressRef.current = 0;
      setPhase("slide");
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [cards, playbackHeld, navTick]);

  useLayoutEffect(() => {
    if (phase !== "rest" || !trackRef.current) return;
    trackRef.current.style.transform = "";
  }, [phase]);

  useEffect(() => {
    if (phase !== "slide") {
      slideProgressRef.current = 0;
      return;
    }
    if (playbackHeld) return;
    const track = trackRef.current;
    if (!track) {
      finishSlide();
      return;
    }
    // Timers keep the pair moving even when the tab is in the background.
    // The track travels from the current pair toward the next pair on its left, so both images move right.
    const startProgress = slideProgressRef.current;
    const start = performance.now();
    let timer = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const t = Math.min(1, startProgress + (performance.now() - start) / SLIDE_MS);
      slideProgressRef.current = t;
      const eased = 1 - (1 - t) ** 3;
      track.style.transform = `translateX(${(-50 * (1 - eased)).toFixed(3)}%)`;
      if (t < 1) {
        timer = window.setTimeout(tick, 16);
        return;
      }
      finishSlide();
    };
    timer = window.setTimeout(tick, 16);
    const remaining = SLIDE_MS * (1 - startProgress);
    const fallback = window.setTimeout(finishSlide, remaining + 400);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [phase, playbackHeld, finishSlide]);

  return (
    <main
      className={`play-kiosk fixed inset-0 z-30 overflow-hidden ${hideCursor && !pickerOpen ? "is-idle" : ""}`}
      data-play-look={look}
      data-play-shuffle={shuffleLooks ? "true" : "false"}
      data-play-status={status}
      data-play-count={count}
      data-play-index={safeIndex}
      data-play-phase={phase}
      data-play-paused={paused ? "true" : "false"}
      data-play-picker={pickerOpen ? "open" : "closed"}
    >
      <style>{`
        .play-kiosk {
          color: var(--play-ink);
          background:
            radial-gradient(ellipse 80% 60% at 50% 42%, #17151d 0%, #0c0b10 68%);
          --play-ink: #fff8ef;
          --play-ink-soft: rgba(255, 248, 239, 0.8);
          --play-ink-faint: rgba(255, 248, 239, 0.4);
          --play-title-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
          --play-chip-bg: rgba(0, 0, 0, 0.4);
          --play-chip-border: rgba(255, 248, 239, 0.2);
          --play-chip-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
          --play-list-bg: rgba(12, 11, 16, 0.88);
          --play-list-border: rgba(255, 248, 239, 0.16);
          --play-list-ink: #fff8ef;
          --play-list-hover: rgba(255, 248, 239, 0.14);
          --play-thumb-bg: rgba(255, 248, 239, 0.08);
        }
        .play-kiosk[data-play-look="party"] {
          background:
            radial-gradient(circle at 88% 92%, rgba(255, 122, 184, 0.72) 0%, transparent 28%),
            radial-gradient(circle at 8% 0%, #9ec0ff 0%, #2f6bff 16%, #0a1d4d 46%, #020814 100%);
        }
        .play-kiosk[data-play-look="studio"] {
          background:
            radial-gradient(ellipse 80% 50% at 10% -10%, #ffe56a 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 100% 0%, #ff9ac8 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 100%, #2f6bff33 0%, transparent 55%),
            linear-gradient(180deg, #fff8ef, #c9ddff 55%, #ffe8f0);
        }
        .play-kiosk[data-play-look="candy"] {
          background:
            radial-gradient(ellipse 70% 55% at 0% 0%, #ffe56a 0%, transparent 52%),
            radial-gradient(ellipse 60% 50% at 100% 100%, #ff7ab8 0%, transparent 55%),
            linear-gradient(160deg, #fff6ee 0%, #ffd4be 46%, #ffc0d8 100%);
        }
        .play-kiosk[data-play-look="meadow"] {
          background:
            radial-gradient(circle at 88% 10%, #ffe56a 0%, transparent 22%),
            radial-gradient(ellipse 75% 50% at 0% 100%, #8ed9aa 0%, transparent 52%),
            linear-gradient(180deg, #f4fff7 0%, #d9f6e6 50%, #fff8ef 100%);
        }
        .play-kiosk[data-play-look="starlight"] {
          background:
            radial-gradient(circle at 50% 42%, #2a3568 0%, transparent 42%),
            radial-gradient(circle at 16% 82%, #3d2d6e 0%, transparent 32%),
            linear-gradient(180deg, #070b18 0%, #121a32 55%, #05060d 100%);
        }
        .play-kiosk[data-play-look="gold"] {
          background:
            radial-gradient(ellipse 46% 80% at -6% 55%, rgba(255, 214, 90, 0.42) 0%, transparent 70%),
            radial-gradient(circle at 92% 78%, rgba(230, 195, 92, 0.5) 0%, transparent 26%),
            radial-gradient(ellipse 70% 42% at 50% 118%, #8a6220 0%, transparent 56%),
            linear-gradient(180deg, #1a130c 0%, #3a2812 48%, #120e09 100%);
        }
        .play-kiosk[data-play-look="bubble"] {
          background:
            radial-gradient(circle at 12% 16%, #ead9ff 0%, transparent 30%),
            radial-gradient(circle at 92% 84%, #ffc6e4 0%, transparent 34%),
            linear-gradient(180deg, #f8f2ff 0%, #ffe8f6 100%);
        }
        .play-kiosk[data-play-look="aurora"] {
          background:
            radial-gradient(ellipse 55% 28% at 74% 20%, rgba(90, 255, 210, 0.55) 0%, transparent 62%),
            radial-gradient(ellipse 48% 32% at 24% 78%, rgba(150, 110, 255, 0.6) 0%, transparent 62%),
            radial-gradient(ellipse 40% 22% at 82% 74%, rgba(255, 130, 190, 0.42) 0%, transparent 62%),
            linear-gradient(180deg, #061018 0%, #081422 52%, #120816 100%);
        }
        .play-kiosk[data-play-look="studio"],
        .play-kiosk[data-play-look="candy"],
        .play-kiosk[data-play-look="meadow"],
        .play-kiosk[data-play-look="bubble"] {
          --play-ink: #14121a;
          --play-ink-soft: rgba(20, 18, 26, 0.72);
          --play-ink-faint: rgba(20, 18, 26, 0.42);
          --play-title-shadow: 0 2px 14px rgba(255, 248, 239, 0.85);
          --play-chip-bg: rgba(255, 248, 239, 0.78);
          --play-chip-border: rgba(20, 18, 26, 0.16);
          --play-chip-shadow: 0 8px 24px rgba(47, 107, 255, 0.16);
          --play-list-bg: rgba(255, 248, 239, 0.92);
          --play-list-border: rgba(20, 18, 26, 0.12);
          --play-list-ink: #14121a;
          --play-list-hover: rgba(20, 18, 26, 0.08);
          --play-thumb-bg: rgba(20, 18, 26, 0.06);
        }
        .play-title {
          color: var(--play-ink);
          text-shadow: var(--play-title-shadow);
        }
        .play-soft {
          color: var(--play-ink-soft);
          text-shadow: var(--play-title-shadow);
        }
        .play-faint {
          color: var(--play-ink-faint);
        }
        .play-chip {
          color: var(--play-ink);
          background: var(--play-chip-bg);
          border: 1px solid var(--play-chip-border);
          box-shadow: var(--play-chip-shadow);
        }
        .play-kiosk .card-front,
        .play-kiosk .card-back {
          animation: none;
        }
        .play-party-decor {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .play-party-decor span {
          position: absolute;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.18);
        }
        .play-party-frame {
          position: absolute;
          inset: 1.4vh 1.4vw;
          border-radius: 28px;
          border: 4px dashed rgba(255, 248, 239, 0.55);
        }
        .play-decor-star span {
          box-shadow: 0 0 10px rgba(255, 248, 239, 0.9);
        }
        .play-decor-bubble span {
          box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
        }
        .play-kiosk.is-idle,
        .play-kiosk.is-idle * {
          cursor: none;
        }
        .play-viewport {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
        }
        .play-track {
          display: flex;
          height: 100%;
          width: 200%;
          transform: translateX(-50%);
        }
        .play-track > .play-panel {
          height: 100%;
          width: 50%;
          flex: 0 0 50%;
          min-width: 0;
        }
        .play-friend-list {
          width: min(24rem, 72vw);
          max-height: min(58vh, 34rem);
          overflow: auto;
          border-radius: 1.25rem;
          border: 1px solid var(--play-list-border);
          background: var(--play-list-bg);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
          padding: 0.4rem;
        }
        .play-friend-list button {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 0.85rem;
          border-radius: 0.95rem;
          padding: 0.45rem 0.7rem;
          text-align: left;
          font-family: var(--font-display), "Fredoka", sans-serif;
          font-size: clamp(1.15rem, 1.8vw, 1.65rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--play-list-ink);
        }
        .play-friend-list button:hover,
        .play-friend-list button[data-play-friend-active="true"] {
          background: var(--play-list-hover);
        }
        .play-friend-list button img {
          width: 3.1rem;
          height: 3.1rem;
          flex: 0 0 auto;
          border-radius: 0.75rem;
          object-fit: cover;
          background: var(--play-thumb-bg);
        }
      `}</style>

      {DECOR[look] ? <PlayDecor look={look} /> : null}

      {titleCard ? (
        <h1 className="play-title pointer-events-none absolute top-[3.2vh] left-[3vw] z-20 max-w-[48vw] font-display text-[clamp(3.4rem,6.6vw,7.6rem)] leading-[0.9] font-bold tracking-tight">
          {cardLabel(titleCard)}
        </h1>
      ) : null}

      <div className="play-viewport">
        {current && count === 1 ? <CardPair card={current} /> : null}
        {current && upcoming ? (
          <div ref={trackRef} className="play-track">
            <div className="play-panel">
              <CardPair card={upcoming} />
            </div>
            <div className="play-panel">
              <CardPair card={current} />
            </div>
          </div>
        ) : null}
        {status === "empty" ? (
          <p className="play-faint absolute inset-0 flex items-center justify-center text-[clamp(1.2rem,2vw,1.7rem)] font-semibold">
            No cards saved yet.
          </p>
        ) : null}
      </div>

      {pickerOpen ? (
        <div
          className="absolute inset-0 z-30"
          onClick={() => setPickerOpen(false)}
        />
      ) : null}

      {count > 0 && cards ? (
        <div className="absolute bottom-[3.2vh] left-[3vw] z-40 flex max-h-[86vh] flex-col items-start justify-end gap-3">
          {pickerOpen ? (
            <div id="play-friend-picker" className="play-friend-list" role="listbox" aria-label="Friends">
              {cards.map((card, cardIndex) => {
                const active = cardIndex === safeIndex;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-play-friend-active={active ? "true" : "false"}
                    onClick={() => showFriend(cardIndex)}
                  >
                    {card.portraitUrl ? <img src={card.portraitUrl} alt="" /> : null}
                    <span className="min-w-0 truncate">{cardLabel(card)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <button
            type="button"
            className="play-chip rounded-full px-6 py-3 font-display text-[clamp(1.45rem,2.3vw,2.15rem)] leading-none font-bold tracking-tight backdrop-blur-md"
            aria-expanded={pickerOpen}
            aria-controls="play-friend-picker"
            onClick={() => setPickerOpen((open) => !open)}
          >
            Friends
          </button>
        </div>
      ) : null}

      {paused ? (
        <p className="play-soft pointer-events-none absolute bottom-[3.2vh] left-1/2 z-20 -translate-x-1/2 font-display text-[clamp(1.45rem,2.3vw,2.15rem)] leading-none font-bold tracking-tight">
          Paused
        </p>
      ) : null}

      <p className="play-title pointer-events-none absolute right-[3vw] bottom-[3.2vh] z-20 font-display text-[clamp(1.85rem,3.1vw,3.45rem)] leading-none font-bold tracking-tight">
        Dana & Friends
      </p>
    </main>
  );
}
