import type { CardSpecial } from "@/lib/themes";

/** Old fixed weakness on every theme. Cards still on this value can be varied. */
export const DEFAULT_WEAKNESS = "Dark ×2";

/** Cute weakness labels in the same style as the original fixed value. */
export const WEAKNESS_OPTIONS = [
  "Dark ×2",
  "Tickle ×2",
  "Nap ×2",
  "Snack ×2",
  "Shy ×2",
  "Rain ×2",
  "Sparkle ×2",
  "Bedtime ×2",
] as const;

export type WeaknessOption = (typeof WEAKNESS_OPTIONS)[number];

/**
 * About 1 in 12 gold, then about 1 in 20 rainbow.
 * Gold is checked first so a card is never both.
 */
export const GOLD_CARD_ODDS = 1 / 12;
export const RAINBOW_CARD_ODDS = 1 / 20;

export function rollSpecialTreatment(
  random: () => number = Math.random,
): CardSpecial | null {
  if (random() < GOLD_CARD_ODDS) return "gold";
  if (random() < RAINBOW_CARD_ODDS) return "rainbow";
  return null;
}

/** Stable new weakness for one card that is still on the old default. */
export function weaknessForId(id: string): WeaknessOption {
  const pool = WEAKNESS_OPTIONS.filter((option) => option !== DEFAULT_WEAKNESS);
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length]!;
}
