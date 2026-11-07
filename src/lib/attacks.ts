import { THEME_LIST, type Attack } from "@/lib/themes";

/** Pickable Attack 1 / Attack 2 presets (shared catalog for both slots). */
export type AttackOption = Attack & { id: string };

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Extra cute skills — either slot can pick these on top of the palette pair. */
const EXTRA_CUTE_ATTACKS: Attack[] = [
  {
    name: "Boop",
    damage: 10,
    description: "One tiny nose boop. The whole room says aww.",
    cost: 1,
  },
  {
    name: "Cheek Squish",
    damage: 20,
    description: "Squishes both cheeks until every friend copies.",
    cost: 1,
  },
  {
    name: "Giggle Storm",
    damage: 40,
    description: "A giggle so bright it hops from friend to friend.",
    cost: 2,
  },
  {
    name: "Snack Hug",
    damage: 30,
    description: "A crumbly hug full of snacks. The smiles stick too.",
    cost: 1,
  },
  {
    name: "Cookie Share",
    damage: 20,
    description: "Breaks one cookie in half. Friendship goes up.",
    cost: 1,
  },
  {
    name: "Tiny Dance",
    damage: 30,
    description: "A little wiggle that pulls shy friends in to dance.",
    cost: 1,
  },
  {
    name: "Star Wink",
    damage: 40,
    description: "A wink that drops a tiny star on every friend's nose.",
    cost: 2,
  },
  {
    name: "Hug Beam",
    damage: 60,
    description: "Arms wide open. Nobody escapes this hug.",
    cost: 2,
  },
  {
    name: "Nap Flop",
    damage: 10,
    description: "Flops into a nap mid-play. Everyone gets sleepy.",
    cost: 1,
  },
  {
    name: "Belly Laugh",
    damage: 50,
    description: "Laughs so hard they tip over, and the party tips too.",
    cost: 2,
  },
  {
    name: "Sparkle Sneeze",
    damage: 20,
    description: "Achoo! Glitter everywhere. Friends come out sparkling.",
    cost: 1,
  },
  {
    name: "Puddle Jump",
    damage: 30,
    description: "One big splash, then giggles for the whole park.",
    cost: 1,
  },
  {
    name: "Head Pat",
    damage: 20,
    description: "A gentle pat. Worries float right off.",
    cost: 1,
  },
  {
    name: "Bunny Hop",
    damage: 30,
    description: "Three little hops, and the quiet friends hop along.",
    cost: 1,
  },
];

/** Palette attacks first, then the extra cute catalog. Either slot can pick any. */
export const ATTACK_OPTIONS: AttackOption[] = (() => {
  const seen = new Set<string>();
  const out: AttackOption[] = [];
  const all = [
    ...THEME_LIST.flatMap((theme) => theme.attacks),
    ...EXTRA_CUTE_ATTACKS,
  ];
  for (const atk of all) {
    const id = `atk-${slug(atk.name)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, ...atk });
  }
  return out;
})();

export function attackOptionByName(name: string): AttackOption | undefined {
  const n = name.trim().toLowerCase();
  return ATTACK_OPTIONS.find((a) => a.name.toLowerCase() === n);
}

export function attackOptionById(id: string): AttackOption | undefined {
  return ATTACK_OPTIONS.find((a) => a.id === id);
}
