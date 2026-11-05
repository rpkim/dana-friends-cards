/** Image models offered in the studio picker (exact API ids). */
export type ImageModelOption = {
  id: string;
  label: string;
  blurb: string;
};

export const IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  {
    id: "gemini-3.1-flash-image",
    label: "Flash 3.1 Image",
    blurb: "Default · Nano Banana 2",
  },
  {
    id: "gemini-nano-banana-2.1",
    label: "Nano Banana 2.1",
    blurb: "gemini-nano-banana-2.1",
  },
  {
    id: "gemini-3-pro-image",
    label: "Pro Image",
    blurb: "gemini-3-pro-image",
  },
  {
    id: "gemini-2.5-flash-image",
    label: "Flash 2.5 Image",
    blurb: "gemini-2.5-flash-image",
  },
  {
    id: "gemini-3.6-flash",
    label: "Flash 3.6",
    blurb: "gemini-3.6-flash · may be text-only",
  },
];

export const DEFAULT_IMAGE_MODEL_ID = IMAGE_MODEL_OPTIONS[0].id;

export const IMAGE_MODEL_STORAGE_KEY = "dana-friends-image-model";

export function isAllowedImageModel(id: string | null | undefined): id is string {
  return !!id && IMAGE_MODEL_OPTIONS.some((o) => o.id === id);
}

export function resolveImageModelId(requested?: string | null): string {
  if (isAllowedImageModel(requested)) return requested;
  return DEFAULT_IMAGE_MODEL_ID;
}

/** Exact picker id only — never silently swap to another model. */
export function parseRequestedImageModel(
  requested?: string | null,
): { ok: true; id: string } | { ok: false; reason: string } {
  const id = (requested || "").trim();
  if (!id) return { ok: true, id: DEFAULT_IMAGE_MODEL_ID };
  if (!isAllowedImageModel(id)) {
    return {
      ok: false,
      reason: `Unsupported image model "${id}". Choose one of: ${IMAGE_MODEL_OPTIONS.map((o) => o.id).join(", ")}.`,
    };
  }
  return { ok: true, id };
}
