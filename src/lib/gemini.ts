import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  DEFAULT_IMAGE_MODEL_ID,
  parseRequestedImageModel,
} from "@/lib/imageModels";
import {
  PHOTO_STYLIZE_INSTRUCTION,
  photoStylizeUserSuffix,
} from "@/lib/photoStylizePrompt";
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

/**
 * Primary style model: Flash (Argon hits free-tier limit:0 on this project).
 * Override with GEMINI_MODEL if Argon/billing becomes available later.
 */
export function styleModelId() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function styleFallbackModelId() {
  return process.env.GEMINI_STYLE_FALLBACK_MODEL || "gemini-3.5-flash";
}

/** Env default image model — gemini-3.1-flash-image unless overridden. */
export function imageModelId() {
  return process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL_ID;
}

/**
 * Resolve the single image model for a request.
 * Per-request picker id wins; otherwise env / default.
 * Never silently substitutes a different model — invalid ids error out.
 */
export function resolveRequestImageModel(
  requested?: string | null,
): { ok: true; id: string } | { ok: false; reason: string } {
  if (requested && requested.trim()) {
    return parseRequestedImageModel(requested);
  }
  const envId = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (envId) return parseRequestedImageModel(envId);
  return { ok: true, id: DEFAULT_IMAGE_MODEL_ID };
}

/** Parts-mixer only — never used for photo stylize (photo uses PHOTO_STYLIZE_INSTRUCTION). */
const PARTS_STYLE_SYSTEM = `You are the art director for Dana & Friends custom trading cards.
Write ONE dense image-generation prompt for polished anime/chibi TCG portrait art from parts.
Match LOHA/Dana-friends example polish: soft cel shading, cute proportions, painted backgrounds, clean linework.
Keep the FULL face visible with margin under the chin. ORIGINAL designs only — no Nintendo trademarks.
Return ONLY the prompt text.`;

export async function buildChibiPrompt(input: {
  theme: string;
  mode: "photo" | "parts";
  typeLabel?: string;
  partsSummary?: string;
  extra?: string;
}): Promise<string> {
  // Photo mode never invents a prompt that can replace the person — see generateChibiImage.
  if (input.mode === "photo") {
    return [
      PHOTO_STYLIZE_INSTRUCTION,
      photoStylizeUserSuffix({
        theme: input.theme,
        typeLabel: input.typeLabel,
      }),
    ].join("\n\n");
  }

  const google = getGeminiClient();
  const fallback = defaultPartsPrompt(input);
  if (!google) return fallback;

  const promptText = [
    `Chrome/style palette hint: ${input.theme}`,
    input.typeLabel ? `Card type label: ${input.typeLabel}` : "",
    `Mode: parts`,
    input.partsSummary ? `Parts: ${input.partsSummary}` : "",
    input.extra || "",
    "Match LOHA/Dana-friends example polish (art quality). Invent an original character from the parts — no trademarks.",
  ]
    .filter(Boolean)
    .join("\n");

  for (const modelId of [styleModelId(), styleFallbackModelId()]) {
    try {
      const result = await generateText({
        model: google(modelId),
        system: PARTS_STYLE_SYSTEM,
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

function defaultPartsPrompt(input: {
  theme: string;
  typeLabel?: string;
  partsSummary?: string;
  extra?: string;
}) {
  return `Polished anime chibi trading-card portrait at LOHA/Dana-friends example quality.
Palette/mood: ${input.theme}. Type: ${input.typeLabel || "custom"}.
Big shiny eyes, soft cel shading, cute proportions, painted background.
${input.partsSummary || ""}
${input.extra || ""}
Original designs only — no Poké Balls, no Nintendo trademarks. Keep the entire face visible with margin under the chin.`;
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

  // Classify 429 / free-tier BEFORE any 402/prepay heuristics
  if (
    httpStatus === 429 ||
    /free_tier_.*limit:\s*0|generate_content_free_tier/i.test(combined) ||
    (/resource_exhausted/i.test(combined) && httpStatus !== 402)
  ) {
    const isImageQuota =
      /free_tier|limit:\s*0|image|argon|imagen/i.test(combined) ||
      httpStatus === 429;
    return {
      message: isImageQuota
        ? "Image model quota is 0 on this API project (free tier). Enable billing / image generation for this key’s Google AI Studio project."
        : bodyMsg || message,
      httpStatus: httpStatus || 429,
      errorKind: isImageQuota ? "free_tier_image_quota" : "rate_limit",
      billing: false,
    };
  }

  if (httpStatus === 402) {
    return {
      message: bodyMsg || message,
      httpStatus: 402,
      errorKind: "prepay_402",
      billing: true,
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
  /** Per-request image model override from the UI picker. */
  imageModel?: string | null;
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

  const resolved = resolveRequestImageModel(opts.imageModel);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason, errorKind: "other" };
  }
  const model = resolved.id;

  const isPhoto = opts.mode === "photo" && !!opts.sourceImage;

  // Photo path: fixed identity-first instruction + attached photo (never text-only).
  // Parts path: still builds a compose prompt (may invent character from parts).
  const prompt = isPhoto
    ? [
        PHOTO_STYLIZE_INSTRUCTION,
        photoStylizeUserSuffix({
          theme: opts.theme,
          typeLabel: opts.typeLabel,
        }),
      ].join("\n\n")
    : await buildChibiPrompt({
        theme: opts.theme,
        mode: opts.mode,
        typeLabel: opts.typeLabel,
        partsSummary: opts.partsSummary,
        extra: opts.extra,
      });

  // Log exact prompt used (never log API keys or image bytes).
  console.info("[gemini] image model:", model);
  console.info("[gemini] mode:", opts.mode);
  console.info("[gemini] prompt:\n" + prompt);

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string; mediaType?: string }
  > = [];

  if (isPhoto && opts.sourceImage) {
    // Photo FIRST as image input — identity source of truth.
    content.push({
      type: "text",
      text: "Attached photo of the person to stylize (identity source — keep this same person):",
    });
    content.push({
      type: "image",
      image: `data:${opts.sourceImage.mediaType};base64,${opts.sourceImage.base64}`,
    });
    content.push({ type: "text", text: prompt });
  } else {
    content.push({ type: "text", text: prompt });
    if (opts.referenceImage) {
      content.push({
        type: "text",
        text: "Match the ART POLISH and chibi quality of this example (style/quality only — invent original characters; no trademarks):",
      });
      content.push({
        type: "image",
        image: `data:${opts.referenceImage.mediaType};base64,${opts.referenceImage.base64}`,
      });
    }
  }

  try {
    const result = await generateText({
      model: google(model),
      // Identity instruction as system when photo-stylizing.
      ...(isPhoto ? { system: PHOTO_STYLIZE_INSTRUCTION } : {}),
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
        reason: `${model} returned no image. ${result.text?.slice(0, 220) || ""}`.trim(),
        errorKind: "other",
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
    const classified = classifySdkError(err);
    return {
      ok: false,
      reason: `[${model}] ${classified.message}`,
      billing: classified.billing,
      httpStatus: classified.httpStatus,
      errorKind: classified.errorKind,
    };
  }
}
