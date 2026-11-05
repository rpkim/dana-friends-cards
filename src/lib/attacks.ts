import { THEME_LIST, type Attack } from "@/lib/themes";

/** Pickable Attack 1 / Attack 2 presets (shared catalog for both slots). */
export type AttackOption = Attack & { id: string };

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Deduped attacks from every chrome palette — either slot can pick any. */
export const ATTACK_OPTIONS: AttackOption[] = (() => {
  const seen = new Set<string>();
  const out: AttackOption[] = [];
  for (const theme of THEME_LIST) {
    for (const atk of theme.attacks) {
      const id = `atk-${slug(atk.name)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, ...atk });
    }
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
