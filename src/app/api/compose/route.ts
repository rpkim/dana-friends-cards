import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { summarizeParts, type PartsSelection } from "@/lib/parts";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const maxDuration = 60;

/** Mix-and-match parts → Gemini anime/chibi portrait for the art frame. */
export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json({
      fallback: true,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Using baked theme art.",
    });
  }

  try {
    const body = (await req.json()) as {
      theme?: string;
      parts?: PartsSelection;
    };
    const theme = body.theme || "dana";
    const parts = body.parts;
    if (!parts) {
      return NextResponse.json({ error: "Missing parts" }, { status: 400 });
    }

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
      mode: "parts",
      partsSummary: summarizeParts(parts),
      extra:
        "Compose one polished anime chibi character from the listed parts. Single character, TCG portrait.",
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
    const message = err instanceof Error ? err.message : "Compose failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}
