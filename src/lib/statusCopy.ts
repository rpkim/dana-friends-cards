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
  ko: string;
  href?: string;
  hrefLabel?: string;
};

export const READY_STATUS: StatusMsg = {
  kind: "ready",
  en: "Ready — baked anime art is showing. Remix parts or tap Regenerate with Gemini.",
  ko: "준비됨 — 기본 애니메 아트가 표시 중입니다. 파츠를 바꾸거나 Gemini로 다시 생성하세요.",
};

/** Only for a literal HTTP 402 from Gemini Prepay. */
export function billingStatus(): StatusMsg {
  return {
    kind: "billing",
    en: "Gemini returned HTTP 402 — Prepay credits are depleted on this API key’s AI Studio project. Top up Prepay there, then retry.",
    ko: "Gemini가 HTTP 402를 반환했습니다 — 이 API 키의 AI Studio 프로젝트 Prepay 크레딧이 소진되었습니다. 해당 프로젝트에서 충전한 뒤 다시 시도하세요.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

/** 429 free-tier image/paid-model quota limit:0 — never call this “402 credits”. */
export function freeTierImageQuotaStatus(): StatusMsg {
  return {
    kind: "quota",
    en: "Image model quota is 0 on this API project (free tier). Enable billing / image generation for this key’s Google AI Studio project.",
    ko: "이 API 프로젝트의 이미지 모델 할당량이 0입니다(무료 티어). 이 키가 속한 Google AI Studio 프로젝트에서 결제/이미지 생성을 활성화하세요.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

export function rateLimitStatus(detail?: string): StatusMsg {
  const extra = detail ? ` ${detail.slice(0, 100)}` : "";
  return {
    kind: "quota",
    en: `Gemini rate/quota limit (HTTP 429).${extra} Wait and retry — this is not HTTP 402 empty credits.`,
    ko: `Gemini 요청/할당량 한도입니다 (HTTP 429). 잠시 후 다시 시도하세요 — 크레딧 소진(402)이 아닙니다.`,
    href: "https://ai.dev/rate-limit",
    hrefLabel: "Check rate limits →",
  };
}

export function stylizeLoading(): StatusMsg {
  return {
    kind: "loading",
    en: "Sending photo to Gemini for a full A4 print sheet (front + back)…",
    ko: "사진으로 A4 인쇄 시트(앞면+뒷면) 생성 중…",
  };
}

export function composeLoading(): StatusMsg {
  return {
    kind: "loading",
    en: "Asking Gemini for anime/chibi art…",
    ko: "Gemini로 애니메/치비 아트 생성 중…",
  };
}

export function stylizeSuccess(model?: string): StatusMsg {
  return {
    kind: "success",
    en: `A4 print sheet ready — front + back side by side${model ? ` (${model})` : ""}.`,
    ko: `A4 인쇄 시트 준비됨 — 앞면+뒷면${model ? ` (${model})` : ""}.`,
  };
}

export function composeSuccess(model?: string): StatusMsg {
  return {
    kind: "success",
    en: `Gemini art ready and applied${model ? ` (${model})` : ""}.`,
    ko: `Gemini 아트가 카드에 적용되었습니다${model ? ` (${model})` : ""}.`,
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

  // 429 / free-tier / RESOURCE_EXHAUSTED first — must win over legacy billing:true flags
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
      // Prefer the clear free-tier image message when image/argon/quota-0 is involved
      if (
        /free_tier|limit:\s*0|image|gemini-.*-image|argon|imagen/i.test(raw) ||
        /image generation quota is 0/i.test(raw)
      ) {
        return "free_tier_image_quota";
      }
      return "rate_limit";
    }
  }

  // Literal 402 only
  if (status === 402) return "prepay_402";

  // Legacy server string that explicitly says prepayment depleted AND mentions 402,
  // or the exact Google 402 body — but NOT if we already know it's 429.
  if (
    status !== 429 &&
    (/prepayment credits are depleted/i.test(raw) ||
      (/\b402\b/.test(raw) && /credit|billing|prepay/i.test(raw)))
  ) {
    return "prepay_402";
  }

  // Do NOT trust billing:true alone — older API routes set it for any RESOURCE_EXHAUSTED
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

/** Map API/SDK noise into bilingual UI copy — never raw "Not Found", never false 402. */
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
          ko: "이 키로는 지금 Gemini 이미지 모델을 쓸 수 없습니다. 사진은 카드에 유지됩니다. 모델 권한을 확인한 뒤 다시 시도하세요.",
        }
      : {
          kind: "error",
          en: "Live Gemini remix unavailable — showing baked anime art. You can still mix parts and print.",
          ko: "실시간 Gemini 리믹스를 사용할 수 없어 기본 아트를 표시합니다. 파츠 조합과 인쇄는 가능합니다.",
        };
  }

  if (kind === "unavailable") {
    return {
      kind: "error",
      en: "Gemini is temporarily unavailable (high demand). Retry in a minute.",
      ko: "Gemini가 일시적으로 혼잡합니다. 잠시 후 다시 시도하세요.",
    };
  }

  if (!raw) {
    return input.context === "stylize"
      ? {
          kind: "error",
          en: "Stylize failed. Photo preview stays on the card — retry or check AI Studio model access.",
          ko: "변환에 실패했습니다. 사진 미리보기는 카드에 유지됩니다. 다시 시도하거나 AI Studio 모델 권한을 확인하세요.",
        }
      : READY_STATUS;
  }

  return {
    kind: "error",
    en: `${statusLabel ? statusLabel + ": " : ""}${raw.slice(0, 160)}${raw.length > 160 ? "…" : ""}`,
    ko: "요청 처리 중 오류가 발생했습니다. 기본/미리보기 아트를 유지합니다.",
  };
}
