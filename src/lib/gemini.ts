import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { GeminiErrorKind } from "@/lib/statusCopy";

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

/** Preferred style model (Argon). Falls back to a free-tier text model when Argon is quota-blocked. */
export function styleModelId() {
  return process.env.GEMINI_MODEL || "gemini-4-argon";
}

export function styleFallbackModelId() {
  return process.env.GEMINI_STYLE_FALLBACK_MODEL || "gemini-2.5-flash";
}

export function imageModelId() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
}

/** Alternate image models to try when the primary returns free-tier limit:0 / 429. */
export function imageFallbackModelIds(): string[] {
  const raw = process.env.GEMINI_IMAGE_FALLBACK_MODELS || "";
  const listed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    "gemini-3-pro-image",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
  ];
  const primary = imageModelId();
  return [...new Set([primary, ...listed, ...defaults])];
}

const STYLE_SYSTEM = `You are the art director for Dana & Friends custom trading cards.
Write ONE dense image-generation prompt for polished anime/chibi TCG portrait art.
Match the visual BAR of premium custom cards like the LOHA snack/night examples and Dana & Friends samples:
big shiny eyes, soft cel shading, cute proportions, painted environment backgrounds, clean linework.
Square composition for a trading-card art window, character centered chest-up (or scene that fits the type).
CRITICAL framing: keep the FULL face visible with margin below the chin — never crop through nose/mouth; leave a little space under the chin and include upper chest. Tall hoods/ears may extend upward but the face must sit fully inside the frame.
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

  const promptText = [
    `Chrome/style palette hint: ${input.theme}`,
    input.typeLabel ? `Card type label: ${input.typeLabel}` : "",
    `Mode: ${input.mode}`,
    input.partsSummary ? `Parts: ${input.partsSummary}` : "",
    input.extra || "",
    "Match LOHA/Dana-friends example polish (art quality), invent original character/outfit.",
  ]
    .filter(Boolean)
    .join("\n");

  for (const modelId of [styleModelId(), styleFallbackModelId()]) {
    try {
      const result = await generateText({
        model: google(modelId),
        system: STYLE_SYSTEM,
        prompt: promptText,
      });
      const text = result.text?.trim();
      if (text && text.length > 40) return text;
    } catch {
      // try next model / fall through to static prompt
    }
  }
  return fallback;
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
Original designs only — no Poké Balls, no Nintendo trademarks. Square TCG art frame. Keep the entire face visible with margin under the chin — do not crop mid-face.`;
}

export type GeminiImageResult =
  | { ok: true; image: string; model: string; prompt: string }
  | {
      ok: false;
      reason: string;
      billing?: boolean;
      httpStatus?: number;
      errorKind?: GeminiErrorKind;
    };

function classifySdkError(err: unknown): {
  message: string;
  httpStatus?: number;
  errorKind: GeminiErrorKind;
  billing: boolean;
} {
  const message = err instanceof Error ? err.message : String(err);
  const anyErr = err as {
    statusCode?: number;
    status?: number;
    responseBody?: string;
    data?: { error?: { code?: number; message?: string; status?: string } };
  };
  const httpStatus =
    anyErr?.statusCode ||
    anyErr?.status ||
    anyErr?.data?.error?.code ||
    undefined;

  let bodyMsg = "";
  try {
    const raw =
      anyErr?.responseBody ||
      (anyErr?.data ? JSON.stringify(anyErr.data) : "");
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      bodyMsg = parsed?.error?.message || "";
    }
  } catch {
    bodyMsg = String(anyErr?.responseBody || "").slice(0, 400);
  }

  const combined = `${message}\n${bodyMsg}`;

  if (
    httpStatus === 402 ||
    /prepayment credits are depleted/i.test(combined)
  ) {
    return {
      message: bodyMsg || message,
      httpStatus: httpStatus || 402,
      errorKind: "prepay_402",
      billing: true,
    };
  }

  if (
    /free_tier_.*limit:\s*0|generate_content_free_tier/i.test(combined) ||
    (httpStatus === 429 &&
      /quota exceeded|resource_exhausted/i.test(combined) &&
      /image|argon|free_tier/i.test(combined))
  ) {
    return {
      message:
        "Image generation quota is 0 on free tier for this project (HTTP 429). Enable billing/image access in AI Studio.",
      httpStatus: httpStatus || 429,
      errorKind: "free_tier_image_quota",
      billing: false,
    };
  }

  if (httpStatus === 429 || /resource_exhausted|\b429\b/i.test(combined)) {
    return {
      message: bodyMsg || message,
      httpStatus: httpStatus || 429,
      errorKind: "rate_limit",
      billing: false,
    };
  }

  if (
    httpStatus === 404 ||
    /\bnot found\b|\b404\b|not_found/i.test(combined)
  ) {
    return {
      message: bodyMsg || message,
      httpStatus: httpStatus || 404,
      errorKind: "not_found",
      billing: false,
    };
  }

  if (httpStatus === 503 || /high demand|unavailable/i.test(combined)) {
    return {
      message: bodyMsg || message,
      httpStatus: httpStatus || 503,
      errorKind: "unavailable",
      billing: false,
    };
  }

  return {
    message: bodyMsg || message,
    httpStatus,
    errorKind: "other",
    billing: false,
  };
}

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
      errorKind: "other",
    };
  }

  const prompt = await buildChibiPrompt({
    theme: opts.theme,
    mode: opts.mode,
    typeLabel: opts.typeLabel,
    partsSummary: opts.partsSummary,
    extra: opts.extra,
  });

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

  let lastFail: Extract<GeminiImageResult, { ok: false }> | null = null;

  for (const model of imageFallbackModelIds()) {
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
        lastFail = {
          ok: false,
          reason: `${model} returned no image. ${result.text?.slice(0, 180) || ""}`.trim(),
          errorKind: "other",
        };
        continue;
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
      const classified = classifySdkError(err);
      lastFail = {
        ok: false,
        reason: classified.message,
        billing: classified.billing,
        httpStatus: classified.httpStatus,
        errorKind: classified.errorKind,
      };
      // Try next image model on quota / not-found; stop early on prepay 402 (all keys same project)
      if (classified.errorKind === "prepay_402") break;
      continue;
    }
  }

  return (
    lastFail || {
      ok: false,
      reason:
        "Image generation quota is 0 on free tier for this project (HTTP 429). Enable billing/image access in AI Studio.",
      httpStatus: 429,
      errorKind: "free_tier_image_quota",
    }
  );
}
