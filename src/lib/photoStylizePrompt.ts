/**
 * Canonical photo → cute/chibi stylize instruction.
 * Identity of the attached photo is highest priority — never invent a new person.
 * Theme/type may only be appended as a short suffix (see `photoStylizeUserSuffix`).
 */
export const PHOTO_STYLIZE_INSTRUCTION = `Stylize the person in the attached photo as a polished cute anime / soft-chibi illustration for a trading-card art frame.

IDENTITY (highest priority — do not break):
- This must still be the SAME person, recognizable next to the original photo.
- Keep face shape, eye shape and color, eyebrows, nose, lips, skin tone, age impression, and any distinctive marks (glasses, freckles, moles, dimples).
- Keep hair color, length, parting, bangs, and texture.
- Keep the mood and expression energy of the photo (smile, shy, serious, playful) — do not swap in a generic happy stock face.
- Keep clothing colors and silhouette when they are visible.
- Do NOT replace them with a different child, a mascot, or a premade “Dana/Pikachu girl” character.

STYLE:
- Cute illustrated look: slightly larger eyes, soft cel shading, clean linework, warm light.
- Proportions can be gently chibi, but the face must still read as that person.
- Full head and face fully inside the frame (forehead, chin, both ears or hair edges). Do not crop the face. Do not zoom into the torso.
- Simple painted background that fits the card type label, behind the person — person stays the subject.

OUTPUT:
- One illustration only. No text, no letters, no card frame, no UI, no watermark.`;

/** Short theme/type suffix only — must not override identity. */
export function photoStylizeUserSuffix(opts: {
  theme?: string;
  typeLabel?: string;
}): string {
  const bits = [
    opts.typeLabel ? `Card type label (background mood only): ${opts.typeLabel}` : "",
    opts.theme ? `Chrome palette hint (background/light only): ${opts.theme}` : "",
    "Do not change the person's identity to match any example character.",
  ].filter(Boolean);
  return bits.join("\n");
}
