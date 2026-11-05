/**
 * Cyan-only face/hand remap on classic sun-hoodie friends-aura stock.
 * Does not change background/mascots/hoodie. No warmSkin wash.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const path = "public/art/backs/friends-aura.jpg";
const { data, info } = await sharp(path)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const out = Buffer.from(data);

let sr = 0, sg = 0, sb = 0, sn = 0;
for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.48); y++) {
  for (let x = Math.floor(w * 0.42); x < Math.floor(w * 0.58); x++) {
    const i = (y * w + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r < 150 || b - r > -5 || r - b < 20) continue;
    sr += r; sg += g; sb += b; sn++;
  }
}
const peach = sn > 50
  ? { r: sr / sn, g: sg / sn, b: sb / sn }
  : { r: 236, g: 172, b: 132 };
const peachLuma = 0.299 * peach.r + 0.587 * peach.g + 0.114 * peach.b;
console.log("peach", peach, sn);

let fixed = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (y < h * 0.155) continue;
    const fx = (x / w - 0.5) / 0.16;
    const fy = (y / h - 0.32) / 0.155;
    const face = fx * fx + fy * fy;
    const handL = ((x / w - 0.3) / 0.09) ** 2 + ((y / h - 0.54) / 0.07) ** 2;
    const handR = ((x / w - 0.7) / 0.09) ** 2 + ((y / h - 0.54) / 0.07) ** 2;
    const onFace = face <= 1 && y <= h * 0.48;
    const onHand = handL <= 1 || handR <= 1;
    if (!onFace && !onHand) continue;

    const i = (y * w + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < 48 || luma > 248) continue;
    if (r < 70 && g < 60 && b < 70) continue;
    if (r > 235 && g > 235 && b > 235) continue;
    if (onFace && y > h * 0.36 && y < h * 0.47 && x > w * 0.43 && x < w * 0.57 && r > g + 35 && r > b + 35) continue;
    if (onFace && y > h * 0.23 && y < h * 0.32 && ((x > w * 0.41 && x < w * 0.47) || (x > w * 0.53 && x < w * 0.59))) {
      if (r > 30 && r < 110 && g > 20 && g < 85 && b > 15 && b < 75 && b - r < 10) continue;
    }

    const cool = b - r;
    if (cool < 6) continue;
    if (b === Math.max(r, g, b) && b - Math.min(r, g, b) > 100 && r < 95) continue;

    const scale = Math.max(0.45, Math.min(1.35, luma / peachLuma));
    let nr = Math.min(255, peach.r * scale);
    let ng = Math.min(255, peach.g * scale);
    let nb = Math.min(255, peach.b * scale);
    if (nr - nb < 28) {
      nr = Math.min(255, luma * 1.2);
      ng = luma * 0.92;
      nb = luma * 0.7;
    }
    const d = onFace ? Math.sqrt(face) : Math.sqrt(Math.min(handL, handR));
    const t = Math.min(1, (1 - d * 0.2) * (0.92 + Math.min(0.08, cool / 80)));
    out[i] = Math.round(r * (1 - t) + nr * t);
    out[i + 1] = Math.round(g * (1 - t) + ng * t);
    out[i + 2] = Math.round(b * (1 - t) + nb * t);
    fixed++;
  }
}

writeFileSync(
  path,
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .toBuffer(),
);
console.log("fixed cyan pixels", fixed);
