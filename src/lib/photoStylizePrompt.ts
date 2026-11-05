/**
 * Photo → A4 print-sheet generation prompt (verbatim user copy).
 * Only name / HP / attack strings may be substituted when the form differs
 * from the defaults embedded below. Layout, style, and identity lines stay exact.
 */

export const DEFAULT_PRINT_NAME = "DANA";
export const DEFAULT_PRINT_HP = "999";
export const DEFAULT_ATTACK1_NAME = "Endless Energy";
export const DEFAULT_ATTACK1_DAMAGE = "30";
export const DEFAULT_ATTACK1_TEXT =
  "Dana never runs out of energy! She plays, dances and laughs all day without ever getting tired.";
export const DEFAULT_ATTACK2_NAME = "Instant Friendship";
export const DEFAULT_ATTACK2_DAMAGE = "60";
export const DEFAULT_ATTACK2_TEXT =
  "Makes a brand-new friend in under a minute. The opponent becomes her friend and joins the party!";

/** Canonical prompt body — do not rewrite layout/style/identity lines. */
export const PHOTO_STYLIZE_INSTRUCTION = `Create a print-ready A4 sheet featuring two side-by-side Pokemon trading cards of identical size, separated by a vertical center dashed line ("CUT OR FOLD HERE ✂").

IDENTITY & PORTRAIT (High Priority):
- Stylize the person in the provided photo as a cute anime/chibi character for the front card image box.
- Maintain recognizable facial features, hair color/style, skin tone, and expression from the photo.
- The character wears a yellow Pikachu hoodie with cute Pikachu ears.

CARD 1 (LEFT - FRONT DESIGN):
- Theme: Bright golden-yellow official Pokemon TCG card frame.
- Header: "DANA" in bold 3D bubble letters on top left, "HP 999" on top right.
- Center Art: The stylized anime character sitting inside the illustration frame, smiling cheerfully against a lightning/Pokemon gym background.
- Attack 1: "Endless Energy 30" with text "Dana never runs out of energy! She plays, dances and laughs all day without ever getting tired."
- Attack 2: "Instant Friendship 60" with text "Makes a brand-new friend in under a minute. The opponent becomes her friend and joins the party!"
- Bottom Box: "Weakness Dark x2", "Resistance -", "Retreat 1".

CARD 2 (RIGHT - BACK DESIGN):
- Theme: Matching golden-yellow frame and star-patterned background.
- Top Header: "Dana & Friends" in large playful 3D cartoon font.
- Center Art Box: A cute illustration of the chibi Pikachu-hoodie girl surrounded by cute mascot friends (Pikachu, Eevee, Charmander, Squirtle, Piplup).
- Middle Text: "LET'S PLAY TOGETHER!" in bold uppercase text.
- Bottom Box: "Endless Energy & Friendship!" and "DANA'S SPECIAL CARD • 2026".

PAGE LAYOUT & STYLE:
- Include Top Margin Text: "A4 SIZE (210 x 297 mm)" and "PRINT AT 100% SCALE (DO NOT FIT TO PAGE)".
- Include crop/alignment marks at the paper corners.
- Colors must be vibrant yellow/gold throughout (DO NOT use pink or generic background colors).
- High resolution, crisp lines, clean 2D vector art style.`;

export type PhotoPrintSheetFields = {
  name?: string;
  hp?: number | string;
  attack1Name?: string;
  attack1Damage?: number | string;
  attack1Text?: string;
  attack2Name?: string;
  attack2Damage?: number | string;
  attack2Text?: string;
};

/**
 * Returns the verbatim print-sheet prompt, substituting only name / HP /
 * attack strings when the form values differ from the embedded defaults.
 */
export function buildPhotoPrintSheetPrompt(
  fields: PhotoPrintSheetFields = {},
): string {
  let prompt = PHOTO_STYLIZE_INSTRUCTION;

  const name = (fields.name ?? "").trim().toUpperCase() || DEFAULT_PRINT_NAME;
  const hp = String(fields.hp ?? DEFAULT_PRINT_HP).trim() || DEFAULT_PRINT_HP;
  const a1Name =
    (fields.attack1Name ?? "").trim() || DEFAULT_ATTACK1_NAME;
  const a1Dmg =
    String(fields.attack1Damage ?? DEFAULT_ATTACK1_DAMAGE).trim() ||
    DEFAULT_ATTACK1_DAMAGE;
  const a1Text =
    (fields.attack1Text ?? "").trim() || DEFAULT_ATTACK1_TEXT;
  const a2Name =
    (fields.attack2Name ?? "").trim() || DEFAULT_ATTACK2_NAME;
  const a2Dmg =
    String(fields.attack2Damage ?? DEFAULT_ATTACK2_DAMAGE).trim() ||
    DEFAULT_ATTACK2_DAMAGE;
  const a2Text =
    (fields.attack2Text ?? "").trim() || DEFAULT_ATTACK2_TEXT;

  if (name !== DEFAULT_PRINT_NAME) {
    prompt = prompt.replace(
      'Header: "DANA" in bold 3D bubble letters on top left',
      `Header: "${name}" in bold 3D bubble letters on top left`,
    );
  }

  if (hp !== DEFAULT_PRINT_HP) {
    prompt = prompt.replace('"HP 999"', `"HP ${hp}"`);
  }

  if (
    a1Name !== DEFAULT_ATTACK1_NAME ||
    a1Dmg !== DEFAULT_ATTACK1_DAMAGE ||
    a1Text !== DEFAULT_ATTACK1_TEXT
  ) {
    prompt = prompt.replace(
      `- Attack 1: "Endless Energy 30" with text "${DEFAULT_ATTACK1_TEXT}"`,
      `- Attack 1: "${a1Name} ${a1Dmg}" with text "${a1Text}"`,
    );
  }

  if (
    a2Name !== DEFAULT_ATTACK2_NAME ||
    a2Dmg !== DEFAULT_ATTACK2_DAMAGE ||
    a2Text !== DEFAULT_ATTACK2_TEXT
  ) {
    prompt = prompt.replace(
      `- Attack 2: "Instant Friendship 60" with text "${DEFAULT_ATTACK2_TEXT}"`,
      `- Attack 2: "${a2Name} ${a2Dmg}" with text "${a2Text}"`,
    );
  }

  return prompt;
}

/** @deprecated theme/type suffix removed — full A4 prompt is self-contained. */
export function photoStylizeUserSuffix(_opts: {
  theme?: string;
  typeLabel?: string;
}): string {
  return "";
}
