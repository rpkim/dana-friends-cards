import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { summarizeParts, type PartsSelection } from "@/lib/parts";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json({
      fallback: true,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Using starter art.",
    });
  }

  try {
    const body = (await req.json()) as {
      palette?: string;
      theme?: string;
      typeLabel?: string;
      exampleRef?: string;
      parts?: PartsSelection;
    };
    const palette = body.palette || body.theme || "electric";
    const parts = body.parts;
    if (!parts) {
      return NextResponse.json({ error: "Missing parts" }, { status: 400 });
    }

    let referenceImage: { base64: string; mediaType: string } | undefined;
    const refPath = (body.exampleRef || "").replace(/^\//, "");
    if (refPath && !refPath.includes("..")) {
      try {
        const buf = await readFile(path.join(process.cwd(), "public", refPath));
        referenceImage = {
          base64: buf.toString("base64"),
          mediaType: refPath.endsWith(".webp") ? "image/webp" : "image/jpeg",
        };
      } catch {
        /* optional */
      }
    }

    const result = await generateChibiImage({
      theme: palette,
      mode: "parts",
      typeLabel: body.typeLabel || "Custom Type",
      partsSummary: summarizeParts(parts),
      extra:
        "Compose one polished anime chibi character from the listed parts. Single character, TCG portrait at LOHA/Dana-friends example quality.",
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
