import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

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
    const exampleRef = String(form.get("exampleRef") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";

    const referenceImage = await loadReference(exampleRef, palette);

    const result = await generateChibiImage({
      theme: palette,
      mode: "photo",
      typeLabel,
      extra:
        "Keep the person recognizable as a cute anime chibi; chest-up TCG portrait at LOHA/Dana-friends example polish.",
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
        httpStatus: result.httpStatus,
        errorKind: result.errorKind,
      });
    }

    return NextResponse.json({
      image: result.image,
      provider: "google-gemini",
      model: result.model,
      styleModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}

async function loadReference(
  exampleRef: string,
  palette: string,
): Promise<{ base64: string; mediaType: string } | undefined> {
  const candidates = [
    exampleRef,
    `/examples/${palette === "autumn" ? "loha-snack" : palette === "aura" ? "loha-night" : "dana"}.webp`,
    `/art/${palette === "electric" ? "dana" : palette === "autumn" ? "thea" : palette === "aura" ? "ritsuki" : "josephine"}.jpg`,
  ].filter(Boolean);

  for (const ref of candidates) {
    try {
      const cleaned = ref.replace(/^\//, "");
      if (cleaned.includes("..")) continue;
      const buf = await readFile(path.join(process.cwd(), "public", cleaned));
      const mediaType = cleaned.endsWith(".webp")
        ? "image/webp"
        : cleaned.endsWith(".png")
          ? "image/png"
          : "image/jpeg";
      return { base64: buf.toString("base64"), mediaType };
    } catch {
      /* try next */
    }
  }
  return undefined;
}
