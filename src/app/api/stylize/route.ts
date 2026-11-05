import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";

export const maxDuration = 120;

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
    const typeLabel = String(form.get("typeLabel") || "");
    const imageModel = String(
      form.get("imageModel") || form.get("GEMINI_IMAGE_MODEL") || "",
    );
    const name = String(form.get("name") || "");
    const hp = String(form.get("hp") || "");
    const caption = String(form.get("caption") || "");
    const attack1Name = String(form.get("attack1Name") || "");
    const attack1Damage = String(form.get("attack1Damage") || "");
    const attack1Text = String(form.get("attack1Text") || "");
    const attack2Name = String(form.get("attack2Name") || "");
    const attack2Damage = String(form.get("attack2Damage") || "");
    const attack2Text = String(form.get("attack2Text") || "");
    const weakness = String(form.get("weakness") || "");
    const resistance = String(form.get("resistance") || "");
    const retreat = String(form.get("retreat") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";

    // Photo + live-form A4 print-sheet template. Returns a full sheet image
    // (front left / back right) — not a portrait for the art frame.
    const result = await generateChibiImage({
      theme: palette,
      mode: "photo",
      typeLabel,
      sourceImage: {
        base64: bytes.toString("base64"),
        mediaType,
      },
      imageModel: imageModel || undefined,
      cardFields: {
        paletteId: palette,
        name,
        hp,
        typeLabel,
        caption,
        attack1Name,
        attack1Damage,
        attack1Text,
        attack2Name,
        attack2Damage,
        attack2Text,
        weakness,
        resistance,
        retreat,
      },
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
      kind: "print-sheet",
      provider: "google-gemini",
      model: result.model,
      styleModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      // Echo prompt text only (no keys / no image bytes) for debugging.
      prompt: result.prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}
