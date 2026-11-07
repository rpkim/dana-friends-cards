import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import { NextResponse } from "next/server";

export const maxDuration = 180;

const MAX_INSTRUCTION = 500;

type PortraitSource = { base64: string; mediaType: string };

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message, reason: message }, { status });
}

function parseDataUrl(value: string): PortraitSource | null {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(value.trim());
  if (!match) return null;
  const mediaType = (match[1] || "image/png").toLowerCase();
  const base64 = match[2].replace(/\s/g, "");
  if (!mediaType.startsWith("image/") || !base64) return null;
  return { base64, mediaType };
}

async function portraitFromValue(
  value: unknown,
): Promise<PortraitSource | null> {
  if (value instanceof File) {
    if (value.size === 0) return null;
    const mediaType = (value.type || "image/jpeg").toLowerCase();
    if (!mediaType.startsWith("image/")) return null;
    const bytes = Buffer.from(await value.arrayBuffer());
    if (!bytes.length) return null;
    return { base64: bytes.toString("base64"), mediaType };
  }
  if (typeof value === "string" && value.startsWith("data:")) {
    return parseDataUrl(value);
  }
  return null;
}

async function readRefineRequest(req: Request): Promise<
  | {
      ok: true;
      source: PortraitSource;
      instruction: string;
      imageModel: string;
    }
  | { ok: false; response: NextResponse }
> {
  const contentType = req.headers.get("content-type") || "";
  let source: PortraitSource | null = null;
  let instruction = "";
  let imageModel = "";

  if (contentType.includes("application/json")) {
    let body: {
      image?: unknown;
      portrait?: unknown;
      instruction?: unknown;
      imageModel?: unknown;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return { ok: false, response: fail("Refine body must be JSON or a portrait upload.") };
    }
    source = await portraitFromValue(body.image ?? body.portrait);
    instruction = String(body.instruction || "");
    imageModel = String(body.imageModel || "");
  } else {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return { ok: false, response: fail("Refine body must include the current portrait.") };
    }
    source = await portraitFromValue(form.get("image") ?? form.get("portrait"));
    instruction = String(form.get("instruction") || "");
    imageModel = String(form.get("imageModel") || form.get("GEMINI_IMAGE_MODEL") || "");
  }

  const change = instruction.trim();
  if (!change) {
    return { ok: false, response: fail("Type what to change on the portrait.") };
  }
  if (change.length > MAX_INSTRUCTION) {
    return {
      ok: false,
      response: fail(`Keep the refine instruction under ${MAX_INSTRUCTION} characters.`),
    };
  }
  if (!source) {
    return {
      ok: false,
      response: fail("Missing the current portrait image."),
    };
  }

  return { ok: true, source, instruction: change, imageModel };
}

export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json(
      {
        error:
          "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Refine needs a key.",
        reason:
          "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Refine needs a key.",
      },
      { status: 503 },
    );
  }

  try {
    const parsed = await readRefineRequest(req);
    if (!parsed.ok) return parsed.response;

    const result = await generateChibiImage({
      theme: "refine",
      mode: "photo",
      photoKind: "refine",
      extra: parsed.instruction,
      sourceImage: parsed.source,
      imageModel: parsed.imageModel || undefined,
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
      portrait: result.image,
      provider: "google-gemini",
      model: result.model,
      prompt: result.prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refine failed";
    return NextResponse.json({ error: message, reason: message }, { status: 500 });
  }
}
