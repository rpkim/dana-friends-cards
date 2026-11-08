/** Caption-under-art presets — labels must match product copy exactly. */
export const CAPTION_PRESETS = [
  "Cuteness 100%",
  "Playfulness 100%",
  "Smile Power 100%",
  "Energy 999",
  "Best Friend Mode",
  "Snack Attack Ready",
  "Nap Resistance 0",
  "Chaos Cute",
  "Tiny Legend",
  "Heart Full",
  "Party Starter",
  "Shy but Mighty",
  "Sunshine Kid",
  "Night Owl",
  "Donut Defender",
  "Hug Dealer",
  "Mischief 80%",
  "Main Character",
] as const;

export type CaptionPreset = (typeof CAPTION_PRESETS)[number];

export const DEFAULT_CAPTION: CaptionPreset = "Cuteness 100%";

/** Select value for the AI-from-photo special option. */
export const CAPTION_AI_VALUE = "__ai_from_photo__";

export const CAPTION_AI_LABEL = "Write from photo (AI)";

export function isCaptionPreset(value: string): value is CaptionPreset {
  return (CAPTION_PRESETS as readonly string[]).includes(value);
}
