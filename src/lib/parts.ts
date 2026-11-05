export type PartCategory = "look" | "outfit" | "accessory" | "backdrop";

export type PartOption = {
  id: string;
  label: string;
  category: PartCategory;
  prompt: string;
};

export type PartsSelection = Record<PartCategory, string>;

export type ArtPlan = {
  /** Base portrait URL for the art frame */
  artUrl: string;
  /** Backdrop mood wash over the portrait */
  backdropWash: string;
  /** Soft edge vignette color */
  vignette: string;
  /** Accessory overlay kind */
  accessory: "none" | "shades" | "bow-bag" | "star-pin" | "donut";
  /** Short labels for the selection chip strip */
  labels: { look: string; outfit: string; accessory: string; backdrop: string };
};

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

const LOOK_BASE: Record<string, string> = {
  "look-kid-a": "/art/dana.jpg",
  "look-kid-b": "/art/thea.jpg",
  "look-kid-c": "/art/variants/boy-sunhood.jpg",
  "look-kid-d": "/art/josephine.jpg",
};

const OUTFIT_BASE: Record<string, string> = {
  "outfit-sunhood": "", // defer to look/backdrop
  "outfit-maple": "/art/variants/maple-dress.jpg",
  "outfit-aura": "/art/variants/aura-hoodie.jpg",
  "outfit-kitty": "/art/variants/kitty-hoodie.jpg",
  "outfit-snack": "/art/thea.jpg",
  "outfit-night": "/art/ritsuki.jpg",
};

const BACKDROP_BASE: Record<string, string> = {
  "bg-sunny": "",
  "bg-pumpkin": "/art/variants/maple-dress.jpg",
  "bg-aura": "/art/variants/aura-hoodie.jpg",
  "bg-blossom": "/art/josephine.jpg",
  "bg-cafe": "/art/thea.jpg",
  "bg-night": "/art/ritsuki.jpg",
};

const BACKDROP_WASH: Record<string, { wash: string; vignette: string }> = {
  "bg-sunny": {
    wash: "transparent",
    vignette: "rgba(47,107,255,0)",
  },
  "bg-pumpkin": {
    wash: "linear-gradient(180deg, rgba(255,140,40,.18), rgba(180,60,10,.28))",
    vignette: "rgba(160,70,10,.45)",
  },
  "bg-aura": {
    wash: "linear-gradient(180deg, rgba(40,80,220,.22), rgba(10,20,80,.4))",
    vignette: "rgba(20,40,140,.5)",
  },
  "bg-blossom": {
    wash: "linear-gradient(180deg, rgba(255,160,200,.2), rgba(255,120,170,.28))",
    vignette: "rgba(220,80,140,.4)",
  },
  "bg-cafe": {
    wash: "linear-gradient(180deg, rgba(220,160,80,.2), rgba(120,70,30,.3))",
    vignette: "rgba(100,55,20,.45)",
  },
  "bg-night": {
    wash: "linear-gradient(180deg, rgba(20,30,90,.25), rgba(5,10,40,.45))",
    vignette: "rgba(5,10,40,.55)",
  },
};

const ACCESSORY_KIND: Record<string, ArtPlan["accessory"]> = {
  "acc-none": "none",
  "acc-shades": "shades",
  "acc-bow-bag": "bow-bag",
  "acc-star-pin": "star-pin",
  "acc-donut": "donut",
};

/**
 * Resolve baked portrait + mood overlays so every chip change is visible
 * even when Gemini image quota is 0.
 */
export function artPlanFor(parts: PartsSelection): ArtPlan {
  const look = getPart(parts.look);
  const outfit = getPart(parts.outfit);
  const accessory = getPart(parts.accessory);
  const backdrop = getPart(parts.backdrop);

  const outfitUrl = OUTFIT_BASE[parts.outfit] || "";
  const backdropUrl = BACKDROP_BASE[parts.backdrop] || "";
  const lookUrl = LOOK_BASE[parts.look] || STARTER_ART;

  // Outfit wins when it has dedicated art; else backdrop theme; else look base.
  const artUrl = outfitUrl || backdropUrl || lookUrl;

  const mood = BACKDROP_WASH[parts.backdrop] || BACKDROP_WASH["bg-sunny"];

  return {
    artUrl,
    backdropWash: mood.wash,
    vignette: mood.vignette,
    accessory: ACCESSORY_KIND[parts.accessory] || "none",
    labels: {
      look: look?.label || "Look",
      outfit: outfit?.label || "Outfit",
      accessory: accessory?.label || "None",
      backdrop: backdrop?.label || "Backdrop",
    },
  };
}

/** @deprecated use artPlanFor — kept for callers that only need a URL */
export function fallbackArtFor(parts: PartsSelection): string {
  return artPlanFor(parts).artUrl;
}
