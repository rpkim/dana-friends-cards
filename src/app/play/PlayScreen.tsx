"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CardBack } from "@/components/CardBack";
import { CardFront, type CardData } from "@/components/CardFront";
import { listSavedCards, type SavedCard } from "@/lib/cardLibrary";
import { themeFromDraft } from "@/lib/cardModel";

const ADVANCE_MS = 5000;
const SLIDE_MS = 900;
const CURSOR_IDLE_MS = 2200;

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepFriend]);

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
      className={`play-kiosk fixed inset-0 z-30 overflow-hidden bg-[#0c0b10] text-[#fff8ef] ${hideCursor && !pickerOpen ? "is-idle" : ""}`}
      data-play-status={status}
      data-play-count={count}
      data-play-index={safeIndex}
      data-play-phase={phase}
      data-play-paused={paused ? "true" : "false"}
      data-play-picker={pickerOpen ? "open" : "closed"}
    >
      <style>{`
        .play-kiosk {
          background:
            radial-gradient(ellipse 80% 60% at 50% 42%, #17151d 0%, #0c0b10 68%);
        }
        .play-kiosk .card-front,
        .play-kiosk .card-back {
          animation: none;
        }
        .play-kiosk.is-idle,
        .play-kiosk.is-idle * {
          cursor: none;
        }
        .play-viewport {
          position: absolute;
          inset: 0;
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
          border: 1px solid rgba(255, 248, 239, 0.16);
          background: rgba(12, 11, 16, 0.88);
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
          color: #fff8ef;
        }
        .play-friend-list button:hover,
        .play-friend-list button[data-play-friend-active="true"] {
          background: rgba(255, 248, 239, 0.14);
        }
        .play-friend-list button img {
          width: 3.1rem;
          height: 3.1rem;
          flex: 0 0 auto;
          border-radius: 0.75rem;
          object-fit: cover;
          background: rgba(255, 248, 239, 0.08);
        }
      `}</style>

      {titleCard ? (
        <h1 className="pointer-events-none absolute top-[3.2vh] left-[3vw] z-20 max-w-[48vw] font-display text-[clamp(3.4rem,6.6vw,7.6rem)] leading-[0.9] font-bold tracking-tight text-[#fff8ef] [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
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
          <p className="absolute inset-0 flex items-center justify-center text-[clamp(1.2rem,2vw,1.7rem)] font-semibold text-[#fff8ef]/40">
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
            className="rounded-full border border-[#fff8ef]/20 bg-black/40 px-6 py-3 font-display text-[clamp(1.45rem,2.3vw,2.15rem)] leading-none font-bold tracking-tight text-[#fff8ef] shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md"
            aria-expanded={pickerOpen}
            aria-controls="play-friend-picker"
            onClick={() => setPickerOpen((open) => !open)}
          >
            Friends
          </button>
        </div>
      ) : null}

      {paused ? (
        <p className="pointer-events-none absolute bottom-[3.2vh] left-1/2 z-20 -translate-x-1/2 font-display text-[clamp(1.45rem,2.3vw,2.15rem)] leading-none font-bold tracking-tight text-[#fff8ef]/80 [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">
          Paused
        </p>
      ) : null}

      <p className="pointer-events-none absolute right-[3vw] bottom-[3.2vh] z-20 font-display text-[clamp(1.85rem,3.1vw,3.45rem)] leading-none font-bold tracking-tight text-[#fff8ef] [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">
        Dana & Friends
      </p>
    </main>
  );
}
