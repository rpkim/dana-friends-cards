/**
 * Style palettes control card chrome colors only.
 * Dana / Thea / Ritsuki / Josephine example cards are visual REFERENCES —
 * not product themes. See docs/product-decisions.md.
 */

export type PaletteId = "electric" | "autumn" | "aura" | "sparkle";

export type Attack = {
  name: string;
  damage: number;
  description: string;
  cost: number;
};

export type Theme = {
  id: PaletteId;
  label: string;
  /** Default display name suggestion only — user can change freely */
  name: string;
  hp: number;
  playType: string;
  age: string;
  playfulness: string;
  cardNo: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  border: string;
  text: string;
  headerFill: string;
  panel: string;
  artBg: string;
  motif: "bolt" | "leaf" | "aura" | "sparkle";
  attacks: [Attack, Attack];
  weakness: string;
  resistance: string;
  retreat: number;
  flavor: string;
  /** Optional Gemini style-reference image (example card polish) */
  exampleRef?: string;
  starterArt?: string;
};

export const THEMES: Record<PaletteId, Theme> = {
  electric: {
    id: "electric",
    label: "Electric yellow",
    name: "FRIEND",
    hp: 100,
    playType: "Play Type • Energy",
    age: "Age —",
    playfulness: "Playfulness 100%",
    cardNo: "001/018",
    accent: "#FFD400",
    accentSoft: "#FFF4A8",
    accentDeep: "#1A2B8F",
    border: "#F5C400",
    text: "#1A1A1A",
    headerFill: "#FFE96A",
    panel: "#FFF8D6",
    artBg: "linear-gradient(180deg,#87CEEB 0%,#FFE56A 70%,#FFCB05 100%)",
    motif: "bolt",
    attacks: [
      {
        name: "Endless Energy",
        damage: 30,
        description:
          "Never runs out of energy — plays, dances and laughs all day.",
        cost: 1,
      },
      {
        name: "Instant Friendship",
        damage: 60,
        description:
          "Makes a brand-new friend in under a minute. The whole party joins in!",
        cost: 2,
      },
    ],
    weakness: "Dark ×2",
    resistance: "—",
    retreat: 1,
    flavor:
      "Powered by endless energy and a heart full of friendship — every day feels like a party!",
    exampleRef: "/examples/dana.webp",
    starterArt: "/art/dana.jpg",
  },
  autumn: {
    id: "autumn",
    label: "Autumn outdoor",
    name: "FRIEND",
    hp: 80,
    playType: "Play Type • Outdoor",
    age: "Age —",
    playfulness: "Playfulness 100%",
    cardNo: "002/018",
    accent: "#E8A020",
    accentSoft: "#FFE2B0",
    accentDeep: "#5C2E0A",
    border: "#D9891A",
    text: "#2A1808",
    headerFill: "#FFD48A",
    panel: "#FFF1DA",
    artBg: "linear-gradient(180deg,#7EC8E8 0%,#F4B860 55%,#C65D1A 100%)",
    motif: "leaf",
    attacks: [
      {
        name: "Shades On!",
        damage: 20,
        description:
          "Puts on pink sunglasses and strikes a pose. Everyone nearby starts smiling.",
        cost: 1,
      },
      {
        name: "Best Friend Power",
        damage: 60,
        description:
          "Holding hands with a best friend makes them unstoppable. Double the fun!",
        cost: 2,
      },
    ],
    weakness: "Dark ×2",
    resistance: "Bolt —",
    retreat: 1,
    flavor:
      "Partner in fun — wherever they go, laughter follows!",
    exampleRef: "/examples/thea.webp",
    starterArt: "/art/thea.jpg",
  },
  aura: {
    id: "aura",
    label: "Blue aura",
    name: "FRIEND",
    hp: 90,
    playType: "Play Type • Aura",
    age: "Age —",
    playfulness: "Playfulness 88%",
    cardNo: "003/018",
    accent: "#2F6BFF",
    accentSoft: "#A8C4FF",
    accentDeep: "#061433",
    border: "#163A8A",
    text: "#EAF0FF",
    headerFill: "#163A8A",
    panel: "#0D224F",
    artBg: "linear-gradient(180deg,#081428 0%,#1B3F8A 50%,#3D7CFF 100%)",
    motif: "aura",
    attacks: [
      {
        name: "Cool Stare",
        damage: 30,
        description:
          "Crosses arms and flashes a side smile. Nobody can tell what they are thinking.",
        cost: 1,
      },
      {
        name: "Aura Power",
        damage: 60,
        description:
          "With best friends beside them, quiet strength protects the whole party.",
        cost: 2,
      },
    ],
    weakness: "Dark ×2",
    resistance: "—",
    retreat: 1,
    flavor:
      "Calm on the outside, adventure on the inside — the friend everyone can count on!",
    exampleRef: "/examples/ritsuki.webp",
    starterArt: "/art/ritsuki.jpg",
  },
  sparkle: {
    id: "sparkle",
    label: "Pink sparkle",
    name: "FRIEND",
    hp: 85,
    playType: "Play Type • Sparkle",
    age: "Age —",
    playfulness: "Playfulness 100%",
    cardNo: "004/018",
    accent: "#FF7AB8",
    accentSoft: "#FFD6EA",
    accentDeep: "#6B1F52",
    border: "#E85A9B",
    text: "#3A1230",
    headerFill: "#FFB3D6",
    panel: "#FFE8F3",
    artBg: "linear-gradient(180deg,#F7C8E8 0%,#FF9AC8 55%,#C98BFF 100%)",
    motif: "sparkle",
    attacks: [
      {
        name: "Kitty Charm",
        damage: 30,
        description:
          "A soft smile and a little wave that melts every stubborn frown nearby.",
        cost: 1,
      },
      {
        name: "Heart Spark",
        damage: 60,
        description:
          "Quiet magic wraps the party in sparkles — every friend feels special.",
        cost: 2,
      },
    ],
    weakness: "Dark ×2",
    resistance: "—",
    retreat: 1,
    flavor:
      "Soft, sweet and quietly magical — makes every friend feel special!",
    exampleRef: "/examples/josephine.webp",
    starterArt: "/art/josephine.jpg",
  },
};

export const THEME_LIST = Object.values(THEMES);

/** @deprecated use PaletteId — kept for gradual rename */
export type ThemeId = PaletteId;
