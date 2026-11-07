import { connection, NextResponse } from "next/server";
import { blobConfigured, CardStorageError, listCloudCards } from "@/lib/cardBlobStore";

export const maxDuration = 60;

function safeMessage(message: string) {
  const cleaned = message.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  return (cleaned || "Could not load saved cards.").slice(0, 300);
}

function storageError(err: unknown) {
  if (err instanceof CardStorageError) {
    return NextResponse.json(
      { configured: err.configured, error: err.message },
      { status: err.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const message = err instanceof Error && err.message ? err.message : "Could not load saved cards.";
  return NextResponse.json(
    { configured: true, error: safeMessage(message) },
    { status: 500, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET() {
  await connection();
  if (!blobConfigured()) {
    return NextResponse.json(
      { configured: false, cards: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const cards = await listCloudCards();
    return NextResponse.json(
      { configured: true, cards },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    return storageError(err);
  }
}
