/**
 * Hue-based warm-skin correction: cyan/blue face pixels → peach skin,
 * preserving luminance. Leaves saturated blue hoodie/bg alone.
 */
import sharp from "sharp";
import { writeFileSync } from "fs";

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
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
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
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
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
}

function feather(x, y, w, h, boxes) {
  let best = 0;
  for (const [y0, y1, x0, x1] of boxes) {
    const cx = ((x0 + x1) / 2) * w;
    const cy = ((y0 + y1) / 2) * h;
    const rx = ((x1 - x0) / 2) * w * 1.2;
    const ry = ((y1 - y0) / 2) * h * 1.2;
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d <= 1) best = Math.max(best, Math.pow(1 - d, 1.2));
  }
  return best;
}

async function warmFile(path, boxes) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  let changed = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const weight = feather(x, y, w, h, boxes);
      if (weight < 0.08) continue;
      const i = (y * w + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const [hue, sat, lit] = rgbToHsl(r, g, b);
      // Skip deep navy hair, pure white eyes, saturated crystal blue bg
      if (lit < 0.18 || lit > 0.92) continue;
      if (sat > 0.62 && hue > 190 && hue < 250) continue; // hoodie crystal / bg

      const coolSkin =
        (hue >= 160 && hue <= 270 && sat > 0.08 && sat < 0.55) ||
        (b > r + 4 && sat < 0.4 && lit > 0.28 && lit < 0.85) ||
        (Math.abs(r - g) < 25 && b >= r - 5 && sat < 0.35 && lit > 0.3);

      if (!coolSkin) continue;

      // Target peach hue ~28°, moderate sat, keep luminance (slightly lift)
      const targetHue = 28;
      const targetSat = Math.min(0.42, Math.max(0.22, sat * 0.7 + 0.18));
      const targetLit = Math.min(0.78, lit * 0.92 + 0.08);
      const [nr, ng, nb] = hslToRgb(targetHue, targetSat, targetLit);
      const t = Math.min(1, weight * 1.05);
      out[i] = Math.round(r * (1 - t) + nr * t);
      out[i + 1] = Math.round(g * (1 - t) + ng * t);
      out[i + 2] = Math.round(b * (1 - t) + nb * t);
      changed++;
    }
  }

  const jpeg = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .jpeg({ quality: 93 })
    .toBuffer();
  writeFileSync(path, jpeg);

  // measure first box
  const [fy0, fy1, fx0, fx1] = boxes[0];
  const { data: d2 } = await sharp(path)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  let rr = 0,
    gg = 0,
    bb = 0,
    c = 0;
  for (let y = Math.floor(h * fy0); y < Math.floor(h * fy1); y++) {
    for (let x = Math.floor(w * fx0); x < Math.floor(w * fx1); x++) {
      const i = (y * w + x) * 4;
      rr += d2[i];
      gg += d2[i + 1];
      bb += d2[i + 2];
      c++;
    }
  }
  console.log(
    path.split("/").pop(),
    "changed",
    changed,
    "face RGB",
    (rr / c).toFixed(1),
    (gg / c).toFixed(1),
    (bb / c).toFixed(1),
    "B-R",
    ((bb - rr) / c).toFixed(1),
  );
}

// Restore from git? No — work on current files. Re-copy from previous
// failed edits is fine; hue pass is relative.

await warmFile("public/art/backs/friends-aura.jpg", [
  [0.12, 0.4, 0.34, 0.66], // face
  [0.46, 0.6, 0.2, 0.38], // left hand
  [0.46, 0.6, 0.62, 0.8], // right hand
]);
await warmFile("public/art/demo/jay-blue-portrait.jpg", [
  [0.12, 0.46, 0.3, 0.7],
  [0.52, 0.78, 0.28, 0.72],
]);
await warmFile("public/art/demo/jay-blue-friends-scene.jpg", [
  [0.12, 0.4, 0.32, 0.68],
  [0.46, 0.62, 0.18, 0.4],
  [0.46, 0.62, 0.6, 0.82],
]);
console.log("done");
