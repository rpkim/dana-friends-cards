/**
 * Client-side anime/chibi-ish stylization fallback when AI Gateway is unavailable.
 * Soft posterize + boosted edges so the photo still reads as "card art".
 */
export async function stylizeLocally(fileOrDataUrl: Blob | string): Promise<string> {
  const bitmap = await loadBitmap(fileOrDataUrl);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // Warm pastel lift + posterize
    d[i] = quantize(d[i] * 1.08 + 12, 32);
    d[i + 1] = quantize(d[i + 1] * 1.02 + 8, 32);
    d[i + 2] = quantize(d[i + 2] * 1.05 + 18, 32);
  }
  ctx.putImageData(img, 0, 0);

  // Soft vignette + sky wash for card-art feel
  const grad = ctx.createRadialGradient(
    size / 2,
    size * 0.35,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.75,
  );
  grad.addColorStop(0, "rgba(255,244,168,0.15)");
  grad.addColorStop(1, "rgba(30,40,90,0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return canvas.toDataURL("image/png");
}

function quantize(v: number, steps: number) {
  const q = 255 / (steps - 1);
  return Math.max(0, Math.min(255, Math.round(v / q) * q));
}

async function loadBitmap(src: Blob | string): Promise<ImageBitmap> {
  if (typeof src === "string") {
    const res = await fetch(src);
    const blob = await res.blob();
    return createImageBitmap(blob);
  }
  return createImageBitmap(src);
}
