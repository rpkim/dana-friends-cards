import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { generateChibiImage } from "../src/lib/gemini";
import sharp from "sharp";

const root = resolve(__dirname, "..");

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l] as const;
}
function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) r = g = b = l;
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)] as const;
}

async function forcePeach(path: string, faceBox: number[]) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const out = Buffer.from(data);
  const [y0, y1, x0, x1] = faceBox;
  const cy = ((y0 + y1) / 2) * h, cx = ((x0 + x1) / 2) * w;
  const ry = ((y1 - y0) / 2) * h * 1.1, rx = ((x1 - x0) / 2) * w * 1.1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (x - cx) / rx, ny = (y - cy) / ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d > 1) continue;
    const i = (y * w + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hue, sat, lit] = rgbToHsl(r, g, b);
    if (lit < 0.12 || lit > 0.93) continue;
    if (lit < 0.2 && sat < 0.25) continue;
    if (sat > 0.5 && hue > 190 && hue < 250 && lit < 0.5) continue;
    const cool = b >= r - 10 || (hue >= 130 && hue <= 280);
    const t = Math.pow(1 - d, 1.05) * (cool ? 0.95 : 0.5);
    if (t < 0.05) continue;
    const [nr, ng, nb] = hslToRgb(26, Math.min(0.42, 0.3 + sat * 0.15), Math.min(0.82, lit * 0.88 + 0.12));
    out[i] = Math.round(r * (1 - t) + nr * t);
    out[i + 1] = Math.round(g * (1 - t) + ng * t);
    out[i + 2] = Math.round(b * (1 - t) + nb * t);
  }
  // hands
  for (const box of [[0.48, 0.62, 0.18, 0.4], [0.48, 0.62, 0.6, 0.82]] as number[][]) {
    const [hy0, hy1, hx0, hx1] = box;
    const hcy = ((hy0 + hy1) / 2) * h, hcx = ((hx0 + hx1) / 2) * w;
    const hry = ((hy1 - hy0) / 2) * h, hrx = ((hx1 - hx0) / 2) * w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x - hcx) / hrx, ny = (y - hcy) / hry;
      const d = Math.sqrt(nx * nx + ny * ny);
      if (d > 1) continue;
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const [hue, sat, lit] = rgbToHsl(r, g, b);
      if (lit < 0.2 || lit > 0.9 || sat > 0.55) continue;
      if (!(b >= r - 8 || (hue >= 140 && hue <= 270))) continue;
      const t = Math.pow(1 - d, 1.1) * 0.9;
      const [nr, ng, nb] = hslToRgb(26, 0.32, Math.min(0.8, lit * 0.9 + 0.08));
      out[i] = Math.round(r * (1 - t) + nr * t);
      out[i + 1] = Math.round(g * (1 - t) + ng * t);
      out[i + 2] = Math.round(b * (1 - t) + nb * t);
    }
  }
  writeFileSync(path, await sharp(out, { raw: { width: w, height: h, channels: 4 } }).jpeg({ quality: 93 }).toBuffer());
}

function save(dataUrl: string, path: string) {
  const m = /^data:(image\/[^;]+);base64,(.+)$/.exec(dataUrl)!;
  writeFileSync(path, Buffer.from(m[2], "base64"));
}

async function main() {
  const electric = readFileSync(resolve(root, "public/art/backs/friends-electric.jpg"));
  // Generate aura friends from electric composition (natural skin source)
  const stock = await generateChibiImage({
    theme: "aura",
    mode: "photo",
    photoKind: "friends-scene",
    cardFields: { paletteId: "aura", name: "Dana" },
    sourceImage: { base64: electric.toString("base64"), mediaType: "image/jpeg" },
    referenceImage: { base64: electric.toString("base64"), mediaType: "image/jpeg" },
  });
  if (!stock.ok) throw new Error(stock.reason);
  const stockPath = resolve(root, "public/art/backs/friends-aura.jpg");
  save(stock.image, stockPath);
  await forcePeach(stockPath, [0.14, 0.4, 0.34, 0.66]);
  console.log("stock aura ok");

  // Portrait already force-peached; rebuild friends scene from it
  const portrait = readFileSync(resolve(root, "public/art/demo/jay-blue-portrait.jpg"));
  const aura = readFileSync(stockPath);
  const scene = await generateChibiImage({
    theme: "aura",
    mode: "photo",
    photoKind: "friends-scene",
    cardFields: { paletteId: "aura", name: "Jay" },
    sourceImage: { base64: portrait.toString("base64"), mediaType: "image/jpeg" },
    referenceImage: { base64: aura.toString("base64"), mediaType: "image/jpeg" },
  });
  if (!scene.ok) throw new Error(scene.reason);
  const scenePath = resolve(root, "public/art/demo/jay-blue-friends-scene.jpg");
  save(scene.image, scenePath);
  await forcePeach(scenePath, [0.14, 0.4, 0.34, 0.66]);
  await forcePeach(resolve(root, "public/art/demo/jay-blue-portrait.jpg"), [0.14, 0.45, 0.32, 0.68]);
  console.log("jay assets ok");
}
main().catch((e) => { console.error(e); process.exit(1); });
