import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Photo → anime/chibi stylization via Vercel AI Gateway.
 * Returns { image: dataUrl } or { fallback: true, reason } when keys/models are missing.
 */
export async function POST(req: Request) {
  const hasKey = Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
  );

  if (!hasKey) {
    return NextResponse.json({
      fallback: true,
      reason:
        "AI_GATEWAY_API_KEY (or Vercel OIDC) is not configured. Using local stylization.",
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
    const dataUrl = `data:${mediaType};base64,${bytes.toString("base64")}`;

    const prompt = `Transform this photo into a playful anime chibi trading-card portrait for the Dana & Friends ${theme} theme.
Keep the person's likeness recognizable but cute: big eyes, soft shading, clean outlines, bright colors.
Square composition, character centered from chest up, friendly expression.
No trademarks, no Poké Balls, no copyrighted mascots. Original fan-card art style only.
Return a single stylized illustration image.`;

    // Prefer an image-capable gateway model; fall back gracefully on failure.
    const modelId =
      process.env.AI_GATEWAY_IMAGE_MODEL || "google/gemini-2.5-flash-image";

    const result = await generateText({
      model: gateway(modelId),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });

    const fileOut = result.files?.find((f) =>
      (f.mediaType || "").startsWith("image/"),
    );

    if (fileOut) {
      const b64 =
        typeof fileOut.base64 === "string"
          ? fileOut.base64
          : Buffer.from(fileOut.uint8Array).toString("base64");
      return NextResponse.json({
        image: `data:${fileOut.mediaType};base64,${b64}`,
        provider: "ai-gateway",
        model: modelId,
      });
    }

    return NextResponse.json({
      fallback: true,
      reason: "Model returned no image; using local stylization.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({
      fallback: true,
      reason: message,
    });
  }
}
