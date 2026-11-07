import { connection, NextResponse } from "next/server";
import { blobConfigured, CardStorageError, openCardAsset } from "@/lib/cardBlobStore";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; asset: string }> },
) {
  await connection();
  if (!blobConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Card storage is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const { id, asset } = await params;
    const result = await openCardAsset(id, asset);
    if (!result) {
      return NextResponse.json(
        { error: "That image is not in the library." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const raw =
      err instanceof CardStorageError
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : "Could not read the image.";
    const message = (raw.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim() || "Could not read the image.").slice(0, 300);
    const status = err instanceof CardStorageError ? err.status : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
