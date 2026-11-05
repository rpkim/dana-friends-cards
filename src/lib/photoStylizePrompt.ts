import type { PaletteId } from "@/lib/themes";

/**
 * Photo → A4 print-sheet prompt template.
 * Card 2 back title is ALWAYS "Dana & Friends" — never replace with the card name.
 * The "{CARD_NAME} & Friends" back is generated separately (see name-back prompt).
 */

export const PHOTO_PRINT_SHEET_TEMPLATE = `[TASK & OUTPUT FORMAT]
Generate a high-resolution, print-ready A4 sheet containing two side-by-side trading cards of identical dimensions (63mm x 88mm scale), separated by a vertical center dashed fold/cut line only — no scissors icon and no "CUT OR FOLD HERE" text. Page background must be pure white (#FFFFFF). Top of the page includes alignment crop marks and printable margins.

[THEME & COLOR PALETTE]
Primary Color Theme: {CHROME_PALETTE_STYLE}
- Ensure BOTH front and back cards strictly use the {CHROME_PALETTE} color scheme.
- Do NOT alter or switch to other background colors like pink unless explicitly specified in the palette.

[CARD 1 - FRONT DESIGN]
1. Frame Style: Authentic TCG trading card frame layout styled with {CHROME_PALETTE_STYLE} borders and star/energy icon decorations.
2. Header Row:
   - Top-Left Name: "{CARD_NAME}" in bold, 3D bubble style font.
   - Top-Right HP: "HP {HP_VALUE}".
   - Sub-badge: "{TYPE_LABEL}".
3. Center Artwork Box:
   - Subject: Stylize the person in the provided user photo as a cute anime/chibi character (referencing the input image while preserving recognizable facial features, hair, and smile).
   - NEVER paste or embed the raw photograph — the front art must be a stylized illustrated portrait of the same person.
   - Character Outfit: Wearing a cute hoodie matching the theme.
   - Caption Badge inside/below art box: "{CAPTION_UNDER_ART}".
4. Attack & Stats Area:
   - Standard TCG attack layout with skill names, descriptions, damage numbers, weakness, and retreat stats matching the card theme.
   - Attack 1: "{ATTACK1_NAME}" — damage {ATTACK1_DAMAGE}. Description: "{ATTACK1_TEXT}"
   - Attack 2: "{ATTACK2_NAME}" — damage {ATTACK2_DAMAGE}. Description: "{ATTACK2_TEXT}"
   - Bottom stats: Weakness "{WEAKNESS}", Resistance "{RESISTANCE}", Retreat {RETREAT}.

[CARD 2 - BACK DESIGN — BRAND TITLE, DO NOT RENAME]
1. Frame Style: Matching {CHROME_PALETTE_STYLE} border frame and background pattern consistent with the front card.
2. Top Title: Exactly "Dana & Friends" in large, adorable 3D cartoon font. Do NOT replace "Dana" with "{CARD_NAME}" or any other name.
3. Center Graphic Box: Cute chibi illustration of the SAME person from the photo (same face/hair as the front stylized portrait) wearing the theme hoodie, surrounded by cute original anime mascot friends, celebrating together. Hood/ears/accents must match the theme colors (no yellow hood spikes on a blue theme).
4. Bottom Text: "LET'S PLAY TOGETHER!" and exactly "DANA'S SPECIAL CARD • 2026".

[STRICT CONSTRAINTS]
- Exact text rendering: Double-check spellings for "{CARD_NAME}", "HP {HP_VALUE}", "{TYPE_LABEL}", and "{CAPTION_UNDER_ART}".
- The back title must remain "Dana & Friends" — never "{CARD_NAME} & Friends" on this sheet.
- Both left and right cards must maintain perfect horizontal symmetry and identical outer boundary dimensions.
- Front and back must use the same chrome color scheme.
- High quality 2D anime vector style, clean line art.`;

/** Separate single-card back: "{CARD_NAME} & Friends". */
export const PHOTO_NAME_BACK_TEMPLATE = `[TASK & OUTPUT FORMAT]
Generate ONE high-resolution trading-card BACK only (63mm x 88mm scale portrait), not a full A4 sheet and not a front card.

[THEME & COLOR PALETTE]
Primary Color Theme: {CHROME_PALETTE_STYLE}
- Ensure this back strictly uses the {CHROME_PALETTE} color scheme (same chrome as the matching front).

[BACK DESIGN]
1. Frame Style: Authentic TCG card back frame with {CHROME_PALETTE_STYLE} border and matching background pattern.
2. Top Title: Exactly "{CARD_NAME} & Friends" in large, adorable 3D cartoon font.
3. Center Graphic Box: Cute chibi illustration of the SAME person from the provided photo (preserve recognizable face, hair, smile) wearing a theme-matching hoodie, surrounded by cute original anime mascot friends celebrating. Hood/ears/accents must match the theme colors (no yellow hood spikes on a blue theme).
4. Bottom Text: "LET'S PLAY TOGETHER!" and "{CARD_NAME}'S SPECIAL CARD • 2026".

[STRICT CONSTRAINTS]
- This is the NAME back only — title is "{CARD_NAME} & Friends", not "Dana & Friends".
- Do not draw a front card. Do not include a raw photo paste — stylized illustration only.
- High quality 2D anime vector style, clean line art.`;

/** Portrait-only for the live card art frame (never a full sheet). */
export const PHOTO_PORTRAIT_TEMPLATE = `[TASK]
Stylize the person in the provided photo as a single cute anime/chibi trading-card portrait for the FRONT art box only.

[THEME]
{CHROME_PALETTE_STYLE}
- Outfit: cute hoodie matching this theme. Hood/ears/accents must match the theme colors.

[IDENTITY]
- Same person as the photo: keep face, hair, skin tone, expression recognizable.
- Full head and face visible. Soft cel shading, clean linework.
- Simple theme-matching background. No card frame, no text, no letters, no watermark.
- NEVER output a raw/unedited photograph.`;

/** Alias kept for existing imports / logging. */
export const PHOTO_STYLIZE_INSTRUCTION = PHOTO_PRINT_SHEET_TEMPLATE;

/**
 * Exact palette sentences — do not paraphrase.
 * CHROME_PALETTE uses the same sentence so the "strictly use" line is concrete.
 */
export const CHROME_PALETTE_COPY: Record<
  PaletteId,
  { chromePalette: string; chromePaletteStyle: string }
> = {
  electric: {
    chromePalette:
      "Theme: Bright golden-yellow official Pokemon TCG card frame. Front card has yellow Pikachu hoodie and lightning elements. Back card features yellow matching border with cute Pikachu & mascot friends.",
    chromePaletteStyle:
      "Theme: Bright golden-yellow official Pokemon TCG card frame. Front card has yellow Pikachu hoodie and lightning elements. Back card features yellow matching border with cute Pikachu & mascot friends.",
  },
  sparkle: {
    chromePalette:
      "Theme: Soft pastel pink TCG card frame with heart and star sparkle accents. Front card features a cute pink bunny/Eevee hoodie character. Back card matches with pink border, heart patterns, and adorable pink mascot friends.",
    chromePaletteStyle:
      "Theme: Soft pastel pink TCG card frame with heart and star sparkle accents. Front card features a cute pink bunny/Eevee hoodie character. Back card matches with pink border, heart patterns, and adorable pink mascot friends.",
  },
  aura: {
    chromePalette:
      "Theme: Vibrant ice-blue and cyan aura TCG card frame with blue crystal/star accents. Front card features a blue Squirtle/water hoodie character. Back card matches with bright blue border and water/ice style cute mascot friends.",
    chromePaletteStyle:
      "Theme: Vibrant ice-blue and cyan aura TCG card frame with blue crystal/star accents. Front card features a blue Squirtle/water hoodie character. Back card matches with bright blue border and water/ice style cute mascot friends.",
  },
  autumn: {
    chromePalette:
      "Theme: Warm cozy autumn orange and brown TCG card frame with falling leaf accents. Front card features a brown bear/chestnut hoodie character. Back card matches with warm acorn/leaf patterns and cute forest mascot friends.",
    chromePaletteStyle:
      "Theme: Warm cozy autumn orange and brown TCG card frame with falling leaf accents. Front card features a brown bear/chestnut hoodie character. Back card matches with warm acorn/leaf patterns and cute forest mascot friends.",
  },
};

export type PhotoPrintSheetFields = {
  paletteId?: PaletteId | string;
  name?: string;
  hp?: number | string;
  typeLabel?: string;
  caption?: string;
  attack1Name?: string;
  attack1Damage?: number | string;
  attack1Text?: string;
  attack2Name?: string;
  attack2Damage?: number | string;
  attack2Text?: string;
  weakness?: string;
  resistance?: string;
  retreat?: number | string;
};

function fill(template: string, key: string, value: string): string {
  return template.split(`{${key}}`).join(value);
}

function resolveFields(fields: PhotoPrintSheetFields = {}) {
  const paletteId = (fields.paletteId || "electric") as PaletteId;
  const chrome =
    CHROME_PALETTE_COPY[paletteId] || CHROME_PALETTE_COPY.electric;
  const cardName = (fields.name ?? "").trim() || "DANA";
  const hpRaw = String(fields.hp ?? "").trim();
  const hp = hpRaw === "" ? "100" : hpRaw;
  const typeLabel = (fields.typeLabel ?? "").trim() || "Play Type";
  const caption = (fields.caption ?? "").trim() || "Cuteness 100%";
  const a1Name = (fields.attack1Name ?? "").trim() || "Attack 1";
  const a1Dmg = String(fields.attack1Damage ?? 30).trim() || "30";
  const a1Text = (fields.attack1Text ?? "").trim() || "";
  const a2Name = (fields.attack2Name ?? "").trim() || "Attack 2";
  const a2Dmg = String(fields.attack2Damage ?? 60).trim() || "60";
  const a2Text = (fields.attack2Text ?? "").trim() || "";
  const weakness = (fields.weakness ?? "").trim() || "Dark ×2";
  const resistance = (fields.resistance ?? "").trim() || "—";
  const retreat = String(fields.retreat ?? 1).trim() || "1";
  return {
    chrome,
    cardName,
    hp,
    typeLabel,
    caption,
    a1Name,
    a1Dmg,
    a1Text,
    a2Name,
    a2Dmg,
    a2Text,
    weakness,
    resistance,
    retreat,
  };
}

/** A4 sheet: front + Dana & Friends back (brand title never renamed). */
export function buildPhotoPrintSheetPrompt(
  fields: PhotoPrintSheetFields = {},
): string {
  const f = resolveFields(fields);
  let prompt = PHOTO_PRINT_SHEET_TEMPLATE;
  prompt = fill(prompt, "CHROME_PALETTE_STYLE", f.chrome.chromePaletteStyle);
  prompt = fill(prompt, "CHROME_PALETTE", f.chrome.chromePalette);
  prompt = fill(prompt, "CARD_NAME", f.cardName);
  prompt = fill(prompt, "HP_VALUE", f.hp);
  prompt = fill(prompt, "TYPE_LABEL", f.typeLabel);
  prompt = fill(prompt, "CAPTION_UNDER_ART", f.caption);
  prompt = fill(prompt, "ATTACK1_NAME", f.a1Name);
  prompt = fill(prompt, "ATTACK1_DAMAGE", f.a1Dmg);
  prompt = fill(prompt, "ATTACK1_TEXT", f.a1Text);
  prompt = fill(prompt, "ATTACK2_NAME", f.a2Name);
  prompt = fill(prompt, "ATTACK2_DAMAGE", f.a2Dmg);
  prompt = fill(prompt, "ATTACK2_TEXT", f.a2Text);
  prompt = fill(prompt, "WEAKNESS", f.weakness);
  prompt = fill(prompt, "RESISTANCE", f.resistance);
  prompt = fill(prompt, "RETREAT", f.retreat);
  return prompt;
}

/** Single back titled "{CARD_NAME} & Friends". */
export function buildNameFriendsBackPrompt(
  fields: PhotoPrintSheetFields = {},
): string {
  const f = resolveFields(fields);
  let prompt = PHOTO_NAME_BACK_TEMPLATE;
  prompt = fill(prompt, "CHROME_PALETTE_STYLE", f.chrome.chromePaletteStyle);
  prompt = fill(prompt, "CHROME_PALETTE", f.chrome.chromePalette);
  prompt = fill(prompt, "CARD_NAME", f.cardName);
  return prompt;
}

/** Portrait for the live front art frame. */
export function buildPortraitPrompt(
  fields: PhotoPrintSheetFields = {},
): string {
  const f = resolveFields(fields);
  return fill(
    PHOTO_PORTRAIT_TEMPLATE,
    "CHROME_PALETTE_STYLE",
    f.chrome.chromePaletteStyle,
  );
}

/** @deprecated theme/type suffix removed — template is self-contained. */
export function photoStylizeUserSuffix(_opts: {
  theme?: string;
  typeLabel?: string;
}): string {
  return "";
}
