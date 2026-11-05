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

/** True 402 / prepay balance depleted (AI Studio Prepay). */
export function billingStatus(): StatusMsg {
  return {
    kind: "billing",
    en: "Gemini Prepay credits are depleted (HTTP 402). Top up AI Studio Prepay on the project that owns this API key, then retry.",
    ko: "Gemini Prepay 크레딧이 소진되었습니다 (HTTP 402). 이 API 키가 속한 AI Studio 프로젝트에서 Prepay를 충전한 뒤 다시 시도하세요.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

/**
 * 429 with free-tier image/paid model quota limit:0 — not the same as 402.
 * Common when flash text works but Argon / image models are blocked.
 */
export function freeTierImageQuotaStatus(): StatusMsg {
  return {
    kind: "quota",
    en: "Image generation quota is 0 on the free tier for this project (HTTP 429). Enable billing / image access in AI Studio, or use a key from a project with image quota — then retry stylize.",
    ko: "이 프로젝트의 무료 티어에서는 이미지 생성 할당량이 0입니다 (HTTP 429). AI Studio에서 결제/이미지 권한을 켜거나 이미지 할당량이 있는 키를 사용한 뒤 다시 변환하세요.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
  };
}

export function rateLimitStatus(): StatusMsg {
  return {
    kind: "quota",
    en: "Gemini rate limit hit (HTTP 429). Wait a moment and retry — this is not an empty-credits (402) error.",
    ko: "Gemini 요청 한도에 걸렸습니다 (HTTP 429). 잠시 후 다시 시도하세요 — 크레딧 소진(402)과는 다릅니다.",
    href: "https://ai.dev/rate-limit",
    hrefLabel: "Check rate limits →",
  };
}

export function stylizeLoading(): StatusMsg {
  return {
    kind: "loading",
    en: "Sending photo to Gemini for anime/chibi stylization…",
    ko: "사진을 Gemini로 보내 애니메/치비 스타일 변환 중…",
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
    en: `Photo stylized and applied to the card${model ? ` (${model})` : ""}.`,
    ko: `사진이 변환되어 카드 아트에 적용되었습니다${model ? ` (${model})` : ""}.`,
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

/** Classify raw Gemini / SDK failures — never collapse 429 into “credits empty”. */
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
    status === 402 ||
    input.billing === true ||
    /prepayment credits are depleted|prepay credit/i.test(raw) ||
    (/\b402\b/.test(raw) && /credit|billing|prepay/i.test(raw))
  ) {
    return "prepay_402";
  }

  if (
    /free_tier_.*limit:\s*0|generate_content_free_tier|quota.*limit:\s*0/i.test(
      raw,
    ) ||
    (/image/i.test(raw) &&
      status === 429 &&
      /quota|resource_exhausted/i.test(raw))
  ) {
    return "free_tier_image_quota";
  }

  // Broad RESOURCE_EXHAUSTED / 429 without free-tier limit:0 → rate limit
  if (
    status === 429 ||
    (/resource_exhausted|\b429\b|rate[- ]limit|quota exceeded/i.test(lower) &&
      !/prepayment credits are depleted/i.test(raw))
  ) {
    // Image-model wording without explicit free_tier still usually means no image quota
    if (
      /image|gemini-3-pro-image|flash-image|argon/i.test(raw) &&
      /quota|resource_exhausted|limit:\s*0/i.test(raw)
    ) {
      return "free_tier_image_quota";
    }
    return "rate_limit";
  }

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

  if (kind === "prepay_402") return billingStatus();
  if (kind === "free_tier_image_quota") return freeTierImageQuotaStatus();
  if (kind === "rate_limit") return rateLimitStatus();

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
    en: `${raw.slice(0, 160)}${raw.length > 160 ? "…" : ""}`,
    ko: "요청 처리 중 오류가 발생했습니다. 기본/미리보기 아트를 유지합니다.",
  };
}
