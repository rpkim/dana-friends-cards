export type StatusKind = "ready" | "loading" | "success" | "billing" | "error";

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

export function billingStatus(): StatusMsg {
  return {
    kind: "billing",
    en: "Gemini credits are empty (402). Top up billing, then retry photo stylize / regenerate.",
    ko: "Gemini 크레딧이 없습니다 (402). AI Studio에서 충전한 뒤 사진 변환/재생성을 다시 시도하세요.",
    href: "https://ai.studio/projects",
    hrefLabel: "Open AI Studio →",
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

/** Map API/SDK noise into bilingual UI copy — never raw "Not Found". */
export function fromApiFailure(input: {
  reason?: string | null;
  billing?: boolean;
  httpStatus?: number;
  context: "compose" | "stylize";
}): StatusMsg {
  const raw = (input.reason || "").trim();
  const lower = raw.toLowerCase();
  const billing =
    input.billing ||
    input.httpStatus === 402 ||
    /402|resource_exhausted|prepayment credits|billing|quota|credits are depleted/i.test(
      raw,
    );

  if (billing) return billingStatus();

  if (
    input.httpStatus === 404 ||
    lower === "not found" ||
    /\b404\b/.test(lower) ||
    /model .+ not found|not_found/i.test(raw)
  ) {
    return input.context === "stylize"
      ? {
          kind: "error",
          en: "Gemini stylize unavailable right now. Your photo is on the card — retry after checking API access.",
          ko: "지금은 Gemini 변환을 사용할 수 없습니다. 사진은 카드에 올려 두었습니다. API 확인 후 다시 시도하세요.",
        }
      : {
          kind: "error",
          en: "Live Gemini remix unavailable — showing baked anime art. You can still mix parts and print.",
          ko: "실시간 Gemini 리믹스를 사용할 수 없어 기본 아트를 표시합니다. 파츠 조합과 인쇄는 가능합니다.",
        };
  }

  if (!raw) {
    return input.context === "stylize"
      ? {
          kind: "error",
          en: "Stylize failed. Try another photo or check Gemini credits.",
          ko: "변환에 실패했습니다. 다른 사진으로 시도하거나 Gemini 크레딧을 확인하세요.",
        }
      : READY_STATUS;
  }

  return {
    kind: "error",
    en: `${raw.slice(0, 140)}${raw.length > 140 ? "…" : ""}`,
    ko: "요청 처리 중 오류가 발생했습니다. 기본/미리보기 아트를 유지합니다.",
  };
}
