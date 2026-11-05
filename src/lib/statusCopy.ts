export type StatusKind =
  | "ready"
  | "loading"
  | "success"
  | "billing"
  | "quota"
  | "error";

export type StatusMsg = {
  kind: StatusKind;
  en: string;
  href?: string;
  hrefLabel?: string;
};

export const READY_STATUS: StatusMsg = {
  kind: "ready",
  en: "Ready — upload or capture a photo to stylize with Gemini.",
};

/** Only for a literal HTTP 402 from Gemini Prepay. */
export function billingStatus(): StatusMsg {
  return {
    kind: "billing",
    en: "Gemini returned HTTP 402 — Prepay credits are depleted on this API key’s AI Studio project. Top up Prepay there, then retry.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

/** 429 free-tier image/paid-model quota limit:0 — never call this “402 credits”. */
export function freeTierImageQuotaStatus(): StatusMsg {
  return {
    kind: "quota",
    en: "Image model quota is 0 on this API project (free tier). Enable billing / image generation for this key’s Google AI Studio project.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

export function rateLimitStatus(detail?: string): StatusMsg {
  const extra = detail ? ` ${detail.slice(0, 100)}` : "";
  return {
    kind: "quota",
    en: `Gemini rate/quota limit (HTTP 429).${extra} Wait and retry — this is not HTTP 402 empty credits.`,
    href: "https://ai.dev/rate-limit",
    hrefLabel: "Check rate limits →",
  };
}

export function stylizeLoading(): StatusMsg {
  return {
    kind: "loading",
    en: "Creating A4 print sheet (front + back) from photo…",
  };
}

export function composeLoading(): StatusMsg {
  return {
    kind: "loading",
    en: "Asking Gemini for anime/chibi art…",
  };
}

export function stylizeSuccess(model?: string): StatusMsg {
  return {
    kind: "success",
    en: `A4 print sheet ready — front + back side by side${model ? ` (${model})` : ""}.`,
  };
}

export function composeSuccess(model?: string): StatusMsg {
  return {
    kind: "success",
    en: `Gemini art ready and applied${model ? ` (${model})` : ""}.`,
  };
}

export type GeminiErrorKind =
  | "prepay_402"
  | "free_tier_image_quota"
  | "rate_limit"
  | "not_found"
  | "unavailable"
  | "other";

/**
 * Classify failures. CRITICAL: never map 429 / RESOURCE_EXHAUSTED / billing flags
 * alone to 402. Only a literal HTTP 402 (or errorKind prepay_402) may show 402 copy.
 */
export function classifyGeminiFailure(input: {
  reason?: string | null;
  billing?: boolean;
  httpStatus?: number;
  errorKind?: GeminiErrorKind | string | null;
}): GeminiErrorKind {
  if (input.errorKind === "prepay_402") return "prepay_402";
  if (input.errorKind === "free_tier_image_quota") return "free_tier_image_quota";
  if (input.errorKind === "rate_limit") return "rate_limit";
  if (input.errorKind === "not_found") return "not_found";
  if (input.errorKind === "unavailable") return "unavailable";

  const raw = (input.reason || "").trim();
  const lower = raw.toLowerCase();
  const status = input.httpStatus;

  if (
    status === 429 ||
    /free_tier_.*limit:\s*0|generate_content_free_tier|quota.*limit:\s*0/i.test(
      raw,
    ) ||
    (/resource_exhausted|\b429\b|rate[- ]limit|quota exceeded/i.test(lower) &&
      !/\b402\b/.test(raw))
  ) {
    if (
      /free_tier|limit:\s*0|image|gemini-.*-image|argon|imagen/i.test(raw) ||
      status === 429
    ) {
      if (
        /free_tier|limit:\s*0|image|gemini-.*-image|argon|imagen/i.test(raw) ||
        /image generation quota is 0/i.test(raw)
      ) {
        return "free_tier_image_quota";
      }
      return "rate_limit";
    }
  }

  if (status === 402) return "prepay_402";

  if (
    status !== 429 &&
    (/prepayment credits are depleted/i.test(raw) ||
      (/\b402\b/.test(raw) && /credit|billing|prepay/i.test(raw)))
  ) {
    return "prepay_402";
  }

  if (input.billing === true && status === 402) return "prepay_402";

  if (
    status === 404 ||
    lower === "not found" ||
    /\b404\b|model .+ not found|not_found|unavailable right now/i.test(raw)
  ) {
    return "not_found";
  }

  if (status === 503 || /high demand|unavailable|try again later/i.test(raw)) {
    return "unavailable";
  }

  return "other";
}

/** Map API/SDK noise into English UI copy — never raw "Not Found", never false 402. */
export function fromApiFailure(input: {
  reason?: string | null;
  billing?: boolean;
  httpStatus?: number;
  errorKind?: GeminiErrorKind | string | null;
  context: "compose" | "stylize";
}): StatusMsg {
  const raw = (input.reason || "").trim();
  const kind = classifyGeminiFailure(input);
  const statusLabel =
    input.httpStatus != null ? `HTTP ${input.httpStatus}` : undefined;

  if (kind === "prepay_402") return billingStatus();
  if (kind === "free_tier_image_quota") return freeTierImageQuotaStatus();
  if (kind === "rate_limit") return rateLimitStatus(raw);

  if (kind === "not_found") {
    return input.context === "stylize"
      ? {
          kind: "error",
          en: "Gemini image model unavailable for this key right now. Your photo stays on the card — check model access, then retry.",
        }
      : {
          kind: "error",
          en: "Live Gemini remix unavailable — showing baked anime art. You can still mix parts and print.",
        };
  }

  if (kind === "unavailable") {
    return {
      kind: "error",
      en: "Gemini is temporarily unavailable (high demand). Retry in a minute.",
    };
  }

  if (!raw) {
    return input.context === "stylize"
      ? {
          kind: "error",
          en: "Stylize failed. Photo preview stays on the card — retry or check AI Studio model access.",
        }
      : READY_STATUS;
  }

  return {
    kind: "error",
    en: `${statusLabel ? statusLabel + ": " : ""}${raw.slice(0, 160)}${raw.length > 160 ? "…" : ""}`,
  };
}
