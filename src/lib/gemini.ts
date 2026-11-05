import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

/** Resolve Google API key from either accepted env name. */
export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    undefined
  );
}

export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return createGoogleGenerativeAI({ apiKey });
}

/** Style-direction model (Gemini 4 Argon). Text/vision — not an image emitter. */
export function styleModelId() {
  return process.env.GEMINI_MODEL || "gemini-4-argon";
}

/**
 * Pixel model — Argon does not emit images on the Generative Language API.
 * Default: gemini-3-pro-image (override with GEMINI_IMAGE_MODEL).
 */
export function imageModelId() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
}

const STYLE_SYSTEM = `You are the art director for Dana & Friends 2026 trading cards.
Write a single dense image-generation prompt for polished anime/chibi TCG portrait art.
Match: big shiny eyes, soft cel shading, cute proportions, themed hoodie/outfit, painted background.
Rules: ORIGINAL designs only — no Poké Balls, no Nintendo/Pokémon names or trademarks.
Keep © DANA & FRIENDS 2026 vibe: playful electric / autumn / aura / sparkle themes.
Return ONLY the prompt text, no markdown.`;

export async function buildChibiPrompt(input: {
  theme: string;
  mode: "photo" | "parts";
  partsSummary?: string;
  extra?: string;
}): Promise<string> {
  const google = getGeminiClient();
  const fallback = defaultPrompt(input);
  if (!google) return fallback;

  try {
    const result = await generateText({
      model: google(styleModelId()),
      system: STYLE_SYSTEM,
      prompt: [
        `Theme: ${input.theme}`,
        `Mode: ${input.mode}`,
        input.partsSummary ? `Parts: ${input.partsSummary}` : "",
        input.extra || "",
        "Square TCG art-frame composition, chest-up character centered.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    const text = result.text?.trim();
    return text && text.length > 40 ? text : fallback;
  } catch {
    return fallback;
  }
}

function defaultPrompt(input: {
  theme: string;
  mode: "photo" | "parts";
  partsSummary?: string;
  extra?: string;
}) {
  return `Polished anime chibi trading-card portrait, Dana & Friends ${input.theme} theme.
Big shiny eyes, soft cel shading, cute proportions, painted background.
${input.partsSummary || ""}
${input.extra || ""}
Original designs only — no Poké Balls, no Nintendo trademarks. Square TCG art frame, character centered.`;
}

export type GeminiImageResult =
  | { ok: true; image: string; model: string; prompt: string }
  | { ok: false; reason: string; billing?: boolean };

/**
 * Generate anime/chibi card art pixels.
 * Uses GEMINI_IMAGE_MODEL (gemini-3-pro-image) because gemini-4-argon is text/vision only.
 * Optionally drafts the prompt with Argon first.
 */
export async function generateChibiImage(opts: {
  theme: string;
  mode: "photo" | "parts";
  partsSummary?: string;
  extra?: string;
  /** data URL or raw base64 source photo */
  sourceImage?: { base64: string; mediaType: string };
  referenceImage?: { base64: string; mediaType: string };
}): Promise<GeminiImageResult> {
  const google = getGeminiClient();
  if (!google) {
    return {
      ok: false,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY). Add it in .env.local / Vercel env.",
    };
  }

  const prompt = await buildChibiPrompt({
    theme: opts.theme,
    mode: opts.mode,
    partsSummary: opts.partsSummary,
    extra: opts.extra,
  });

  const model = imageModelId();
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mediaType?: string }
  > = [{ type: "text", text: prompt }];

  if (opts.referenceImage) {
    content.push({
      type: "text",
      text: "Match the polish and anime/chibi quality of this card-art reference (style only, invent original outfits/icons):",
    });
    content.push({
      type: "image",
      image: `data:${opts.referenceImage.mediaType};base64,${opts.referenceImage.base64}`,
    });
  }

  if (opts.sourceImage) {
    content.push({
      type: "text",
      text: "Stylize this photo into the same anime/chibi card-art look while keeping likeness:",
    });
    content.push({
      type: "image",
      image: `data:${opts.sourceImage.mediaType};base64,${opts.sourceImage.base64}`,
    });
  }

  try {
    const result = await generateText({
      model: google(model),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      messages: [{ role: "user", content }],
    });

    const file = result.files?.find((f) =>
      (f.mediaType || "").startsWith("image/"),
    );
    if (!file) {
      return {
        ok: false,
        reason: `${model} returned no image. ${result.text?.slice(0, 180) || ""}`.trim(),
      };
    }

    const b64 =
      typeof file.base64 === "string"
        ? file.base64
        : Buffer.from(file.uint8Array).toString("base64");

    return {
      ok: true,
      image: `data:${file.mediaType};base64,${b64}`,
      model,
      prompt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const billing =
      /402|RESOURCE_EXHAUSTED|prepayment credits|billing/i.test(message);
    const notFound = /\bnot found\b|\b404\b|not_found/i.test(message);
    return {
      ok: false,
      reason: billing
        ? "Gemini API prepayment credits are depleted — top up at https://ai.studio/projects then retry."
        : notFound
          ? "Gemini image model unavailable right now."
          : message,
      billing,
    };
  }
}
