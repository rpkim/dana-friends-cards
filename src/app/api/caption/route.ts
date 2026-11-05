import { generateCaptionFromPhoto, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json(
      {
        error:
          "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Upload still works; AI caption needs a key.",
      },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a photo first." },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";

    const result = await generateCaptionFromPhoto({
      sourceImage: {
        base64: bytes.toString("base64"),
        mediaType,
      },
    });

    if (!result.ok) {
      return NextResponse.json({
        error: result.reason,
        reason: result.reason,
        billing: result.billing || false,
        httpStatus: result.httpStatus,
        errorKind: result.errorKind,
      });
    }

    return NextResponse.json({
      caption: result.caption,
      model: result.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Caption failed";
    return NextResponse.json({ error: message, reason: message });
  }
}
