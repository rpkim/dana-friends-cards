import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

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

export function styleModelId() {
  return process.env.GEMINI_MODEL || "gemini-4-argon";
}

export function imageModelId() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
}

const STYLE_SYSTEM = `You are the art director for Dana & Friends custom trading cards.
Write ONE dense image-generation prompt for polished anime/chibi TCG portrait art.
Match the visual BAR of premium custom cards like the LOHA snack/night examples and Dana & Friends samples:
big shiny eyes, soft cel shading, cute proportions, painted environment backgrounds, clean linework.
Square composition for a trading-card art window, character centered chest-up (or scene that fits the type).
ORIGINAL designs only — no Poké Balls, no Nintendo/Pokémon names or trademarks.
Return ONLY the prompt text.`;

export async function buildChibiPrompt(input: {
  theme: string;
  mode: "photo" | "parts";
  typeLabel?: string;
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
        `Chrome/style palette hint: ${input.theme}`,
        input.typeLabel ? `Card type label: ${input.typeLabel}` : "",
        `Mode: ${input.mode}`,
        input.partsSummary ? `Parts: ${input.partsSummary}` : "",
        input.extra || "",
        "Match LOHA/Dana-friends example polish (art quality), invent original character/outfit.",
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
  typeLabel?: string;
  partsSummary?: string;
  extra?: string;
}) {
  return `Polished anime chibi trading-card portrait at LOHA/Dana-friends example quality.
Palette/mood: ${input.theme}. Type: ${input.typeLabel || "custom"}.
Big shiny eyes, soft cel shading, cute proportions, painted background.
${input.partsSummary || ""}
${input.extra || ""}
Original designs only — no Poké Balls, no Nintendo trademarks. Square TCG art frame.`;
}

export type GeminiImageResult =
  | { ok: true; image: string; model: string; prompt: string }
  | { ok: false; reason: string; billing?: boolean };

export async function generateChibiImage(opts: {
  theme: string;
  mode: "photo" | "parts";
  typeLabel?: string;
  partsSummary?: string;
  extra?: string;
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
    typeLabel: opts.typeLabel,
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
      text: "Match the ART POLISH and chibi quality of this example card illustration (style/quality only — invent original characters; no trademarks):",
    });
    content.push({
      type: "image",
      image: `data:${opts.referenceImage.mediaType};base64,${opts.referenceImage.base64}`,
    });
  }

  if (opts.sourceImage) {
    content.push({
      type: "text",
      text: "Stylize THIS photo into the same polished anime/chibi card-art look while keeping likeness:",
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
