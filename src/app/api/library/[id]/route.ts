import { connection, NextResponse } from "next/server";
import {
  blobConfigured,
  CardStorageError,
  deleteCloudCard,
  readCloudCard,
  saveCloudCard,
} from "@/lib/cardBlobStore";

export const maxDuration = 60;

function safeMessage(message: string) {
  const cleaned = message.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  return (cleaned || "Could not update the card.").slice(0, 300);
}

function storageError(err: unknown) {
  if (err instanceof CardStorageError) {
    return NextResponse.json(
      { configured: err.configured, error: err.message },
      { status: err.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const message = err instanceof Error && err.message ? err.message : "Could not update the card.";
  return NextResponse.json(
    { configured: blobConfigured(), error: safeMessage(message) },
    { status: 500, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  if (!blobConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Card storage is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const { id } = await params;
    const card = await readCloudCard(id);
    if (!card) {
      return NextResponse.json(
        { error: "That card is not in the library." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.json(
      { configured: true, card },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    return storageError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!blobConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Card storage is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const { id } = await params;
    const form = await request.formData();
    const metaRaw = form.get("meta");
    const portrait = form.get("portrait");
    const scene = form.get("scene");
    if (typeof metaRaw !== "string") {
      throw new CardStorageError("The card details are missing.");
    }
    let meta: {
      createdAt?: number;
      updatedAt?: number | null;
      name?: string;
      draft?: unknown;
    };
    try {
      meta = JSON.parse(metaRaw) as typeof meta;
    } catch {
      throw new CardStorageError("The card details could not be read.");
    }
    if (!(portrait instanceof File)) {
      throw new CardStorageError("The portrait image is missing.");
    }
    const card = await saveCloudCard({
      id,
      createdAt: Number(meta.createdAt),
      updatedAt: meta.updatedAt == null ? undefined : Number(meta.updatedAt),
      name: typeof meta.name === "string" ? meta.name : "",
      draft: meta.draft,
      portrait,
      scene: scene instanceof File ? scene : null,
    });
    return NextResponse.json(
      { configured: true, card },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    return storageError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!blobConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Card storage is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const { id } = await params;
    await deleteCloudCard(id);
    return NextResponse.json(
      { configured: true, deleted: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    return storageError(err);
  }
}
