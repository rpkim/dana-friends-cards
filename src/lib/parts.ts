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
  /** Look identity tint (always changes when Look chips change) */
  lookTint: string;
  /** Outfit color grade wash */
  outfitWash: string;
  /** Backdrop mood wash over the portrait */
  backdropWash: string;
  /** Soft edge vignette color */
  vignette: string;
  /** Optional CSS filter on the base portrait (look identity) */
  lookFilter: string;
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

/** Look = character identity (always drives a distinct portrait). */
const LOOK_BASE: Record<string, string> = {
  "look-kid-a": "/art/dana.jpg",
  "look-kid-b": "/art/thea.jpg",
  "look-kid-c": "/art/variants/boy-sunhood.jpg",
  "look-kid-d": "/art/josephine.jpg",
};

/**
 * Outfit-specific baked portraits. Used when the outfit is strongly themed;
 * Look still applies a tint/filter so Look chips remain visible.
 */
const OUTFIT_BASE: Record<string, string> = {
  "outfit-sunhood": "", // keep look portrait (each look has a distinct base)
  "outfit-maple": "/art/variants/maple-dress.jpg",
  "outfit-aura": "/art/variants/aura-hoodie.jpg",
  "outfit-kitty": "/art/variants/kitty-hoodie.jpg",
  "outfit-snack": "/art/thea.jpg",
  "outfit-night": "/art/ritsuki.jpg",
};

/** Look identity tint — always visible even when outfit art replaces the base. */
const LOOK_TINT: Record<string, string> = {
  "look-kid-a": "transparent",
  "look-kid-b": "linear-gradient(180deg, rgba(255,150,60,.22), rgba(180,80,20,.18))",
  "look-kid-c": "linear-gradient(180deg, rgba(60,100,255,.25), rgba(20,40,120,.2))",
  "look-kid-d": "linear-gradient(180deg, rgba(255,120,190,.26), rgba(200,60,140,.18))",
};

const LOOK_FILTER: Record<string, string> = {
  "look-kid-a": "none",
  "look-kid-b": "saturate(1.15) hue-rotate(12deg)",
  "look-kid-c": "saturate(1.05) hue-rotate(-18deg) contrast(1.06)",
  "look-kid-d": "saturate(1.2) hue-rotate(310deg)",
};

const OUTFIT_WASH: Record<string, string> = {
  "outfit-sunhood":
    "linear-gradient(180deg, rgba(255,220,60,.12), rgba(255,180,0,.08))",
  "outfit-maple":
    "linear-gradient(180deg, rgba(220,80,30,.2), rgba(140,40,10,.22))",
  "outfit-aura":
    "linear-gradient(180deg, rgba(40,80,255,.22), rgba(10,20,90,.28))",
  "outfit-kitty":
    "linear-gradient(180deg, rgba(255,140,200,.22), rgba(220,60,140,.2))",
  "outfit-snack":
    "linear-gradient(180deg, rgba(220,160,80,.22), rgba(140,80,30,.2))",
  "outfit-night":
    "linear-gradient(180deg, rgba(30,40,110,.28), rgba(5,10,40,.32))",
};

const BACKDROP_WASH: Record<string, { wash: string; vignette: string }> = {
  "bg-sunny": {
    wash: "transparent",
    vignette: "rgba(47,107,255,0)",
  },
  "bg-pumpkin": {
    wash: "linear-gradient(180deg, rgba(255,140,40,.22), rgba(180,60,10,.32))",
    vignette: "rgba(160,70,10,.5)",
  },
  "bg-aura": {
    wash: "linear-gradient(180deg, rgba(40,80,220,.28), rgba(10,20,80,.45))",
    vignette: "rgba(20,40,140,.55)",
  },
  "bg-blossom": {
    wash: "linear-gradient(180deg, rgba(255,160,200,.24), rgba(255,120,170,.32))",
    vignette: "rgba(220,80,140,.45)",
  },
  "bg-cafe": {
    wash: "linear-gradient(180deg, rgba(220,160,80,.24), rgba(120,70,30,.34))",
    vignette: "rgba(100,55,20,.5)",
  },
  "bg-night": {
    wash: "linear-gradient(180deg, rgba(20,30,90,.3), rgba(5,10,40,.5))",
    vignette: "rgba(5,10,40,.6)",
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
 *
 * Priority:
 * - Look always picks a distinct base portrait (and tint/filter).
 * - Strong outfits swap in dedicated baked art, but Look tint/filter still apply.
 * - Backdrop never replaces the portrait — wash + vignette only.
 * - Accessory is an overlay.
 */
export function artPlanFor(parts: PartsSelection): ArtPlan {
  const look = getPart(parts.look);
  const outfit = getPart(parts.outfit);
  const accessory = getPart(parts.accessory);
  const backdrop = getPart(parts.backdrop);

  const lookUrl = LOOK_BASE[parts.look] || STARTER_ART;
  const outfitUrl = OUTFIT_BASE[parts.outfit] || "";

  // Outfit wins only when it has dedicated art; otherwise keep look identity.
  // Backdrop never overrides the portrait base.
  const artUrl = outfitUrl || lookUrl;

  const mood = BACKDROP_WASH[parts.backdrop] || BACKDROP_WASH["bg-sunny"];

  return {
    artUrl,
    lookTint: LOOK_TINT[parts.look] || "transparent",
    outfitWash: OUTFIT_WASH[parts.outfit] || "transparent",
    backdropWash: mood.wash,
    vignette: mood.vignette,
    lookFilter: LOOK_FILTER[parts.look] || "none",
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
