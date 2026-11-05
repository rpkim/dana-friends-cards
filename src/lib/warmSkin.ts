/**
 * Post-process Gemini images so human skin stays warm peach —
 * theme blues stay on hoodie/background only.
 */
import sharp from "sharp";

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s, l] as const;
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)] as const;
}

/** Face ellipse as fractions of width/height: [y0,y1,x0,x1] */
const DEFAULT_FACE: [number, number, number, number] = [0.14, 0.42, 0.32, 0.68];

/**
 * Warm cyan/blue-tinted skin in a data-URL image toward peach.
 * Returns the same data URL on failure (never blocks generation).
 */
export async function warmSkinDataUrl(
  dataUrl: string,
  faceBox: [number, number, number, number] = DEFAULT_FACE,
): Promise<string> {
  try {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return dataUrl;
    const input = Buffer.from(m[2], "base64");
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const out = Buffer.from(data);
    const [y0, y1, x0, x1] = faceBox;
    const cy = ((y0 + y1) / 2) * h;
    const cx = ((x0 + x1) / 2) * w;
    const ry = ((y1 - y0) / 2) * h * 1.08;
    const rx = ((x1 - x0) / 2) * w * 0.98;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d > 1) continue;
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const [hue, sat, lit] = rgbToHsl(r, g, b);
        if (lit < 0.12 || lit > 0.93) continue;
        if (lit < 0.2 && sat < 0.25) continue;
        if (sat > 0.55 && hue > 190 && hue < 255 && lit < 0.55) continue;
        const cool =
          b >= r - 10 || (hue >= 130 && hue <= 280) ? 1 : 0.45;
        const t = Math.pow(1 - d, 1.1) * cool;
        if (t < 0.05) continue;
        const [nr, ng, nb] = hslToRgb(
          24,
          Math.min(0.4, 0.3 + sat * 0.15),
          Math.min(0.84, lit * 0.86 + 0.12),
        );
        out[i] = Math.round(r * (1 - t) + nr * t);
        out[i + 1] = Math.round(g * (1 - t) + ng * t);
        out[i + 2] = Math.round(b * (1 - t) + nb * t);
      }
    }

    const jpeg = await sharp(out, {
      raw: { width: w, height: h, channels: 4 },
    })
      .jpeg({ quality: 92 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err) {
    console.warn("[warmSkin] skipped:", err instanceof Error ? err.message : err);
    return dataUrl;
  }
}
