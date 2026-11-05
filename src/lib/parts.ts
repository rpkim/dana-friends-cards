export type PartCategory = "look" | "outfit" | "accessory" | "backdrop";

export type PartOption = {
  id: string;
  label: string;
  category: PartCategory;
  prompt: string;
};

export type PartsSelection = Record<PartCategory, string>;

export const PART_CATEGORIES: { id: PartCategory; label: string }[] = [
  { id: "look", label: "Look" },
  { id: "outfit", label: "Outfit" },
  { id: "accessory", label: "Accessory" },
  { id: "backdrop", label: "Backdrop" },
];

export const PARTS: PartOption[] = [
  {
    id: "look-kid-a",
    label: "Kid A",
    category: "look",
    prompt: "cheerful child, soft black bob hair, big shiny eyes, warm smile",
  },
  {
    id: "look-kid-b",
    label: "Kid B",
    category: "look",
    prompt: "cheerful child, long wavy brown hair, big expressive eyes, soft smile",
  },
  {
    id: "look-kid-c",
    label: "Kid C",
    category: "look",
    prompt:
      "cool child, short neat black hair, large dark eyes, slight confident smile",
  },
  {
    id: "look-kid-d",
    label: "Kid D",
    category: "look",
    prompt: "sweet child, soft dark hair, huge sparkling eyes, gentle smile",
  },

  {
    id: "outfit-sunhood",
    label: "Sun Hood",
    category: "outfit",
    prompt:
      "ORIGINAL yellow round-eared sun-creature hoodie with brown tip stripes (not any Nintendo character)",
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
    prompt: "ORIGINAL pink kitty-ear hoodie with darker pink stripes",
  },
  {
    id: "outfit-snack",
    label: "Snack Hoodie",
    category: "outfit",
    prompt: "cozy brown snack-themed hoodie, warm pastry cafe vibes",
  },
  {
    id: "outfit-night",
    label: "Night PJs",
    category: "outfit",
    prompt: "soft night pajamas in a cozy bedroom, moonlit mood",
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
    id: "acc-donut",
    label: "Donut",
    category: "accessory",
    prompt: "holding a cute frosted donut snack",
  },

  {
    id: "bg-sunny",
    label: "Sunny Street",
    category: "backdrop",
    prompt: "painted sunny city street, blue sky, soft sparkles",
  },
  {
    id: "bg-pumpkin",
    label: "Pumpkin Patch",
    category: "backdrop",
    prompt: "painted pumpkin patch, hay bales, falling maple leaves",
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
  {
    id: "bg-cafe",
    label: "Snack Cafe",
    category: "backdrop",
    prompt: "warm outdoor pastry cafe, soft bokeh, cozy snack vibes",
  },
  {
    id: "bg-night",
    label: "Night Nursery",
    category: "backdrop",
    prompt: "nighttime bedroom with crescent moon through the window, stars",
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

export const DEFAULT_PARTS: PartsSelection = {
  look: "look-kid-a",
  outfit: "outfit-sunhood",
  accessory: "acc-star-pin",
  backdrop: "bg-sunny",
};

export const STARTER_ART = "/art/dana.jpg";

export function fallbackArtFor(parts: PartsSelection): string {
  if (parts.outfit === "outfit-maple") return "/art/variants/maple-dress.jpg";
  if (parts.outfit === "outfit-aura") return "/art/variants/aura-hoodie.jpg";
  if (parts.outfit === "outfit-kitty") return "/art/variants/kitty-hoodie.jpg";
  if (parts.outfit === "outfit-night" || parts.backdrop === "bg-night")
    return "/art/ritsuki.jpg";
  if (parts.outfit === "outfit-snack" || parts.backdrop === "bg-cafe")
    return "/art/thea.jpg";
  if (parts.look === "look-kid-c") return "/art/variants/boy-sunhood.jpg";
  if (parts.look === "look-kid-b") return "/art/thea.jpg";
  if (parts.look === "look-kid-d") return "/art/josephine.jpg";
  return STARTER_ART;
}
