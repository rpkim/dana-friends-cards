import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json({
      fallback: true,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Parts/print still work with preview art.",
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    const palette = String(form.get("palette") || form.get("theme") || "electric");
    const typeLabel = String(form.get("typeLabel") || "Custom Type");
    const imageModel = String(
      form.get("imageModel") || form.get("GEMINI_IMAGE_MODEL") || "",
    );

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";

    // Photo is the only image input. Example-card refs are NOT passed — they
    // previously pulled identity toward Dana/LOHA characters. Theme/type are a
    // short suffix only inside PHOTO_STYLIZE_INSTRUCTION handling.
    const result = await generateChibiImage({
      theme: palette,
      mode: "photo",
      typeLabel,
      sourceImage: {
        base64: bytes.toString("base64"),
        mediaType,
      },
      imageModel: imageModel || undefined,
    });

    if (!result.ok) {
      return NextResponse.json({
        fallback: true,
        reason: result.reason,
        billing: result.billing || false,
        httpStatus: result.httpStatus,
        errorKind: result.errorKind,
      });
    }

    return NextResponse.json({
      image: result.image,
      provider: "google-gemini",
      model: result.model,
      styleModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      // Echo prompt text only (no keys / no image bytes) for debugging likeness.
      prompt: result.prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}
