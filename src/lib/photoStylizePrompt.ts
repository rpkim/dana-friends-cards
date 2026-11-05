import type { PaletteId } from "@/lib/themes";

/**
 * Photo → A4 print-sheet prompt template.
 * Only `{...}` placeholders are filled from the live card form.
 * Layout / wording outside braces stays exact.
 */

export const PHOTO_PRINT_SHEET_TEMPLATE = `[TASK & OUTPUT FORMAT]
Generate a high-resolution, print-ready A4 sheet containing two side-by-side trading cards of identical dimensions (63mm x 88mm scale), separated by a vertical center dashed cutting line ("CUT OR FOLD HERE ✂"). Top of the page includes alignment crop marks and printable margins.

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
   - Character Outfit: Wearing a cute hoodie matching the theme.
   - Caption Badge inside/below art box: "{CAPTION_UNDER_ART}".
4. Attack & Stats Area:
   - Standard TCG attack layout with skill names, descriptions, damage numbers, weakness, and retreat stats matching the card theme.
   - Attack 1: "{ATTACK1_NAME}" — damage {ATTACK1_DAMAGE}. Description: "{ATTACK1_TEXT}"
   - Attack 2: "{ATTACK2_NAME}" — damage {ATTACK2_DAMAGE}. Description: "{ATTACK2_TEXT}"
   - Bottom stats: Weakness "{WEAKNESS}", Resistance "{RESISTANCE}", Retreat {RETREAT}.

[CARD 2 - BACK DESIGN]
1. Frame Style: Matching {CHROME_PALETTE_STYLE} border frame and background pattern consistent with the front card.
2. Top Title: "{CARD_NAME} & Friends" in large, adorable 3D cartoon font.
3. Center Graphic Box: Cute chibi illustration of the main character surrounded by cute anime mascot friends, celebrating together.
4. Bottom Text: "LET'S PLAY TOGETHER!" and "{CARD_NAME}'S SPECIAL CARD".

[STRICT CONSTRAINTS]
- Exact text rendering: Double-check spellings for "{CARD_NAME}", "HP {HP_VALUE}", "{TYPE_LABEL}", and "{CAPTION_UNDER_ART}".
- Both left and right cards must maintain perfect horizontal symmetry and identical outer boundary dimensions.
- High quality 2D anime vector style, clean line art.`;

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
      "Bright golden-yellow Pokemon TCG palette, yellow border, lightning and golden star accents",
    chromePaletteStyle:
      "Bright golden-yellow Pokemon TCG palette, yellow border, lightning and golden star accents",
  },
  sparkle: {
    chromePalette:
      "Cute pastel pink sparkle palette, pink border, heart and star accents",
    chromePaletteStyle:
      "Cute pastel pink sparkle palette, pink border, heart and star accents",
  },
  aura: {
    chromePalette:
      "Cool blue aura energy palette, cyan/blue border, water/crystal accents",
    chromePaletteStyle:
      "Cool blue aura energy palette, cyan/blue border, water/crystal accents",
  },
  autumn: {
    chromePalette:
      "Warm autumn cozy palette, orange/brown border, leaf accents",
    chromePaletteStyle:
      "Warm autumn cozy palette, orange/brown border, leaf accents",
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

/**
 * Build the A4 print-sheet prompt by substituting live form values into the
 * template braces. Does not rewrite any non-placeholder wording.
 */
export function buildPhotoPrintSheetPrompt(
  fields: PhotoPrintSheetFields = {},
): string {
  const paletteId = (fields.paletteId || "electric") as PaletteId;
  const chrome =
    CHROME_PALETTE_COPY[paletteId] || CHROME_PALETTE_COPY.electric;

  // Fallbacks: name → DANA; HP blank → 100 (keep 999 only if field says 999);
  // type → Play Type; caption → never blank.
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

  let prompt = PHOTO_PRINT_SHEET_TEMPLATE;
  // Theme section: STYLE first, then the concrete CHROME_PALETTE "strictly use" line.
  prompt = fill(prompt, "CHROME_PALETTE_STYLE", chrome.chromePaletteStyle);
  prompt = fill(prompt, "CHROME_PALETTE", chrome.chromePalette);
  prompt = fill(prompt, "CARD_NAME", cardName);
  prompt = fill(prompt, "HP_VALUE", hp);
  prompt = fill(prompt, "TYPE_LABEL", typeLabel);
  prompt = fill(prompt, "CAPTION_UNDER_ART", caption);
  prompt = fill(prompt, "ATTACK1_NAME", a1Name);
  prompt = fill(prompt, "ATTACK1_DAMAGE", a1Dmg);
  prompt = fill(prompt, "ATTACK1_TEXT", a1Text);
  prompt = fill(prompt, "ATTACK2_NAME", a2Name);
  prompt = fill(prompt, "ATTACK2_DAMAGE", a2Dmg);
  prompt = fill(prompt, "ATTACK2_TEXT", a2Text);
  prompt = fill(prompt, "WEAKNESS", weakness);
  prompt = fill(prompt, "RESISTANCE", resistance);
  prompt = fill(prompt, "RETREAT", retreat);
  return prompt;
}

/** @deprecated theme/type suffix removed — template is self-contained. */
export function photoStylizeUserSuffix(_opts: {
  theme?: string;
  typeLabel?: string;
}): string {
  return "";
}
