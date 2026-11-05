import { THEMES, type PaletteId, type Theme } from "@/lib/themes";

/** Editable fields for any custom card — not locked to example characters. */
export type CardDraft = {
  name: string;
  hp: number;
  typeLabel: string;
  caption: string;
  attack1Name: string;
  attack1Damage: number;
  attack1Text: string;
  attack2Name: string;
  attack2Damage: number;
  attack2Text: string;
  weakness: string;
  resistance: string;
  retreat: number;
  flavor: string;
  cardNo: string;
  paletteId: PaletteId;
};

export function draftFromPalette(paletteId: PaletteId): CardDraft {
  const t = THEMES[paletteId];
  return {
    name: "",
    hp: t.hp,
    typeLabel: t.playType.replace(/^Play Type\s*•\s*/i, "") + " Type",
    caption: "Cuteness 100%",
    attack1Name: t.attacks[0].name,
    attack1Damage: t.attacks[0].damage,
    attack1Text: t.attacks[0].description,
    attack2Name: t.attacks[1].name,
    attack2Damage: t.attacks[1].damage,
    attack2Text: t.attacks[1].description,
    weakness: t.weakness,
    resistance: t.resistance,
    retreat: t.retreat,
    flavor: t.flavor,
    cardNo: t.cardNo,
    paletteId,
  };
}

export function themeFromDraft(draft: CardDraft): Theme {
  const base = THEMES[draft.paletteId];
  return {
    ...base,
    name: (draft.name.trim() || "FRIEND").toUpperCase(),
    hp: draft.hp,
    playType: draft.typeLabel,
    age: draft.caption,
    playfulness: "",
    cardNo: draft.cardNo,
    attacks: [
      {
        name: draft.attack1Name,
        damage: draft.attack1Damage,
        description: draft.attack1Text,
        cost: 1,
      },
      {
        name: draft.attack2Name,
        damage: draft.attack2Damage,
        description: draft.attack2Text,
        cost: 2,
      },
    ],
    weakness: draft.weakness,
    resistance: draft.resistance,
    retreat: draft.retreat,
    flavor: draft.flavor,
  };
}

/** Example cards = visual quality references only (not product themes). */
export const EXAMPLE_CARDS = [
  {
    id: "dana",
    title: "Example · Electric",
    src: "/examples/dana.webp",
    paletteId: "electric" as PaletteId,
  },
  {
    id: "thea",
    title: "Example · Autumn",
    src: "/examples/thea.webp",
    paletteId: "autumn" as PaletteId,
  },
  {
    id: "ritsuki",
    title: "Example · Aura",
    src: "/examples/ritsuki.webp",
    paletteId: "aura" as PaletteId,
  },
  {
    id: "josephine",
    title: "Example · Sparkle",
    src: "/examples/josephine.webp",
    paletteId: "sparkle" as PaletteId,
  },
  {
    id: "loha-snack",
    title: "Example · Snack",
    src: "/examples/loha-snack.webp",
    paletteId: "autumn" as PaletteId,
    typeHint: "Snack Type",
  },
  {
    id: "loha-night",
    title: "Example · Night",
    src: "/examples/loha-night.webp",
    paletteId: "aura" as PaletteId,
    typeHint: "Night Type",
  },
] as const;
