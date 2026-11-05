import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const maxDuration = 60;

/**
 * Photo → anime/chibi via Gemini.
 * Style direction: gemini-4-argon (when available)
 * Pixels: GEMINI_IMAGE_MODEL (default gemini-3-pro-image) — Argon is text/vision only.
 */
export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json({
      fallback: true,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Parts/print still work with baked art.",
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    const theme = String(form.get("theme") || "dana");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";

    let referenceImage: { base64: string; mediaType: string } | undefined;
    try {
      const refPath = path.join(
        process.cwd(),
        "public",
        "art",
        `${theme}.jpg`,
      );
      const ref = await readFile(refPath);
      referenceImage = {
        base64: ref.toString("base64"),
        mediaType: "image/jpeg",
      };
    } catch {
      /* optional */
    }

    const result = await generateChibiImage({
      theme,
      mode: "photo",
      extra:
        "Keep the person recognizable as a cute anime chibi; chest-up TCG portrait.",
      sourceImage: {
        base64: bytes.toString("base64"),
        mediaType,
      },
      referenceImage,
    });

    if (!result.ok) {
      return NextResponse.json({
        fallback: true,
        reason: result.reason,
        billing: result.billing || false,
      });
    }

    return NextResponse.json({
      image: result.image,
      provider: "google-gemini",
      model: result.model,
      styleModel: process.env.GEMINI_MODEL || "gemini-4-argon",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}
