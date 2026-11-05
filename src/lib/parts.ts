export type PartCategory = "base" | "outfit" | "accessory" | "backdrop";

export type PartOption = {
  id: string;
  label: string;
  category: PartCategory;
  /** Prompt fragment sent to Gemini when regenerating */
  prompt: string;
};

export type PartsSelection = Record<PartCategory, string>;

export const PART_CATEGORIES: { id: PartCategory; label: string }[] = [
  { id: "base", label: "Friend base" },
  { id: "outfit", label: "Outfit" },
  { id: "accessory", label: "Accessory" },
  { id: "backdrop", label: "Backdrop" },
];

export const PARTS: PartOption[] = [
  {
    id: "base-dana",
    label: "Dana",
    category: "base",
    prompt:
      "cheerful East Asian girl, black bob hair, big shiny brown eyes, warm smile",
  },
  {
    id: "base-thea",
    label: "Thea",
    category: "base",
    prompt:
      "cheerful girl, long wavy brown hair, big expressive eyes, soft smile",
  },
  {
    id: "base-ritsuki",
    label: "Ritsuki",
    category: "base",
    prompt:
      "cool East Asian boy, short neat black hair, large dark eyes, slight confident smile, arms crossed",
  },
  {
    id: "base-josephine",
    label: "Josephine",
    category: "base",
    prompt:
      "sweet girl, soft dark hair, huge sparkling brown eyes, gentle smile",
  },

  {
    id: "outfit-sunhood",
    label: "Sun Hood",
    category: "outfit",
    prompt:
      "ORIGINAL yellow round-eared sun-creature hoodie with brown tip stripes and peach belly patch (not any Nintendo character)",
  },
  {
    id: "outfit-maple",
    label: "Maple Dress",
    category: "outfit",
    prompt: "cute red autumn dress with tiny green pine-tree pattern",
  },
  {
    id: "outfit-aura",
    label: "Aura Hoodie",
    category: "outfit",
    prompt:
      "ORIGINAL deep-blue aura creature hoodie with long drooping ears and soft black stripes",
  },
  {
    id: "outfit-kitty",
    label: "Kitty Hoodie",
    category: "outfit",
    prompt:
      "ORIGINAL pink kitty-ear hoodie with darker pink stripes, fashion-forward kids look",
  },

  {
    id: "acc-none",
    label: "None",
    category: "accessory",
    prompt: "no extra accessory",
  },
  {
    id: "acc-shades",
    label: "Pink Shades",
    category: "accessory",
    prompt: "translucent pink heart-shaped sunglasses",
  },
  {
    id: "acc-bow-bag",
    label: "Bow Bag",
    category: "accessory",
    prompt: "small black handbag with pink bows",
  },
  {
    id: "acc-star-pin",
    label: "Star Pin",
    category: "accessory",
    prompt: "bright gold friendship star pin on the chest",
  },

  {
    id: "bg-sunny",
    label: "Sunny Street",
    category: "backdrop",
    prompt: "painted sunny city street, blue sky, yellow buildings, soft sparkles",
  },
  {
    id: "bg-pumpkin",
    label: "Pumpkin Patch",
    category: "backdrop",
    prompt: "painted pumpkin patch, hay bales, falling maple leaves, fluffy clouds",
  },
  {
    id: "bg-aura",
    label: "Aura City",
    category: "backdrop",
    prompt: "night city with blue energy aura glow and starry sparkles",
  },
  {
    id: "bg-blossom",
    label: "Blossom Lane",
    category: "backdrop",
    prompt: "pastel blossom street with cherry petals and glitter sparkles",
  },
];

export function partsByCategory(category: PartCategory): PartOption[] {
  return PARTS.filter((p) => p.category === category);
}

export function getPart(id: string): PartOption | undefined {
  return PARTS.find((p) => p.id === id);
}

export function summarizeParts(parts: PartsSelection): string {
  return PART_CATEGORIES.map((c) => getPart(parts[c.id])?.prompt || "")
    .filter(Boolean)
    .join("; ");
}

/** Offline fallback art baked into /public/art (Gemini-quality stills). */
export const THEME_ART: Record<string, string> = {
  dana: "/art/dana.jpg",
  thea: "/art/thea.jpg",
  ritsuki: "/art/ritsuki.jpg",
  josephine: "/art/josephine.jpg",
};

/**
 * Offline mix-and-match preview map when Gemini credits are unavailable.
 * Keys: `${outfit}` — picks closest baked variant.
 */
export const OUTFIT_FALLBACK_ART: Record<string, string> = {
  "outfit-sunhood": "/art/dana.jpg",
  "outfit-maple": "/art/variants/maple-dress.jpg",
  "outfit-aura": "/art/variants/aura-hoodie.jpg",
  "outfit-kitty": "/art/variants/kitty-hoodie.jpg",
};

export const DEFAULT_PARTS: PartsSelection = {
  base: "base-dana",
  outfit: "outfit-sunhood",
  accessory: "acc-star-pin",
  backdrop: "bg-sunny",
};

export const THEME_DEFAULT_PARTS: Record<string, PartsSelection> = {
  dana: {
    base: "base-dana",
    outfit: "outfit-sunhood",
    accessory: "acc-star-pin",
    backdrop: "bg-sunny",
  },
  thea: {
    base: "base-thea",
    outfit: "outfit-maple",
    accessory: "acc-shades",
    backdrop: "bg-pumpkin",
  },
  ritsuki: {
    base: "base-ritsuki",
    outfit: "outfit-aura",
    accessory: "acc-none",
    backdrop: "bg-aura",
  },
  josephine: {
    base: "base-josephine",
    outfit: "outfit-kitty",
    accessory: "acc-bow-bag",
    backdrop: "bg-blossom",
  },
};

export function fallbackArtFor(
  themeId: string,
  parts: PartsSelection,
): string {
  if (parts.base.startsWith("base-") && parts.outfit === THEME_DEFAULT_PARTS[themeId]?.outfit) {
    return THEME_ART[themeId] || THEME_ART.dana;
  }
  if (parts.base === "base-ritsuki" && parts.outfit === "outfit-sunhood") {
    return "/art/variants/boy-sunhood.jpg";
  }
  return (
    OUTFIT_FALLBACK_ART[parts.outfit] ||
    THEME_ART[themeId] ||
    THEME_ART.dana
  );
}
