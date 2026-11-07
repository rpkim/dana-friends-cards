"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const CARD_RATIO = 88.9 / 63.5;

/**
 * html-to-image clones the card into an SVG foreignObject, which drops
 * aspect-ratio and collapses flex-1. Lay the card out in the real document
 * at an explicit 63:88.9 box and pin each band to a pixel height first.
 */
export async function rasterizeCard(node: HTMLElement): Promise<string> {
  // Preview type is sized for a ~400px card. The 63.5mm export box is
  // narrower, so the same px type overflows and the art collapses.
  const width = Math.max(Math.round(node.getBoundingClientRect().width), 420);
  const height = Math.round(width * CARD_RATIO);
  const host = document.createElement("div");
  host.setAttribute("data-card-raster", "1");
  host.setAttribute("data-export-layout", "1");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${width}px`,
    `height:${height}px`,
    "z-index:2147483646",
    "background:#ffffff",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.aspectRatio = "auto";
  clone.style.boxSizing = "border-box";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.animation = "none";
  clone.style.flex = "none";
  // The live face is a 400px design scaled with cqi. Rasterize lays the same
  // face out at this explicit box instead, then pins band heights.
  clone.querySelectorAll<HTMLElement>(".card-scale").forEach((el) => {
    el.style.transform = "none";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.position = "relative";
  });
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    await document.fonts.ready.catch(() => undefined);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    pinCardBands(clone, height);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return await nodeToPng(clone, { pixelRatio: 3 });
  } finally {
    host.remove();
  }
}

/** Instagram birthday square. Laid out at this size before html-to-image. */
export const INSTAGRAM_SQUARE_PX = 1080;

/**
 * Capture a birthday post that already contains the live card front.
 * The square is placed in the document at 1080×1080 first, and the front is
 * pinned to pixel bands, so the foreignObject clone cannot collapse it.
 */
export async function rasterizeInstagramPost(node: HTMLElement): Promise<string> {
  const size = INSTAGRAM_SQUARE_PX;
  const host = document.createElement("div");
  host.setAttribute("data-instagram-raster", "1");
  host.setAttribute("data-export-layout", "1");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${size}px`,
    `height:${size}px`,
    "z-index:2147483646",
    "background:#ffffff",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${size}px`;
  clone.style.height = `${size}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.boxSizing = "border-box";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.animation = "none";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.flex = "none";
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    await document.fonts.ready.catch(() => undefined);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const card = clone.querySelector<HTMLElement>(".card-front");
    if (!card) throw new Error("The card front is not ready to capture.");
    const measuredW = Math.round(card.getBoundingClientRect().width);
    const measuredH = Math.round(card.getBoundingClientRect().height);
    const cardW = measuredW >= 200 ? measuredW : 480;
    const cardH =
      measuredH >= 280 ? measuredH : Math.round(cardW * (88.9 / 63.5));
    card.style.width = `${cardW}px`;
    card.style.height = `${cardH}px`;
    card.style.maxWidth = "none";
    card.style.aspectRatio = "auto";
    card.style.boxSizing = "border-box";
    card.style.margin = "0";
    card.style.transform = "none";
    card.style.animation = "none";
    card.style.flex = "none";
    card.querySelectorAll<HTMLElement>(".card-scale").forEach((el) => {
      el.style.transform = "none";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.position = "relative";
    });
    pinCardBands(card, cardH);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const png = await nodeToPng(clone, {
      pixelRatio: 1,
      width: size,
      height: size,
    });
    const pixels = pngPixelSize(png);
    if (pixels.width !== size || pixels.height !== size) {
      throw new Error(
        `The Instagram image was ${pixels.width}×${pixels.height}, not ${size}×${size}.`,
      );
    }
    return png;
  } finally {
    host.remove();
  }
}

function pngPixelSize(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("The Instagram image was not a PNG.");
  const payload = dataUrl.slice(comma + 1, comma + 1 + 64);
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || sig.some((b, i) => bytes[i] !== b)) {
    throw new Error("The Instagram image was not a PNG.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function pinBox(el: HTMLElement) {
  const h = Math.max(Math.round(el.getBoundingClientRect().height), 1);
  el.style.boxSizing = "border-box";
  el.style.height = `${h}px`;
  el.style.minHeight = `${h}px`;
  el.style.flex = "none";
  el.style.overflow = "visible";
}

function pinCardBands(card: HTMLElement, cardHeight: number) {
  card.style.overflow = "hidden";
  const nameSize = `${Math.max(16, Math.round(cardHeight * 0.055))}px`;
  card.querySelectorAll<HTMLElement>(".card-name").forEach((el) => {
    el.style.fontSize = nameSize;
    el.style.lineHeight = "1.15";
    el.style.paddingTop = "1px";
  });
  void card.offsetHeight;
  const art = card.querySelector<HTMLElement>(".card-art-frame");
  const header = card.querySelector<HTMLElement>("header");
  const lower = art?.nextElementSibling;
  if (art && header && lower instanceof HTMLElement) {
    const headerH = Math.round(header.getBoundingClientRect().height);
    const lowerH = Math.round(lower.getBoundingClientRect().height);
    const measured = Math.round(art.getBoundingClientRect().height);
    const fallback = Math.max(
      Math.round(cardHeight - headerH - lowerH - 36),
      Math.round(cardHeight * 0.3),
    );
    let artH = measured >= cardHeight * 0.22 ? measured : fallback;
    const used = headerH + artH + lowerH;
    const room = cardHeight - 20;
    if (used > room) artH = Math.max(Math.round(cardHeight * 0.26), artH - (used - room));
    pinBox(header);
    art.style.boxSizing = "border-box";
    art.style.flex = "none";
    art.style.height = `${artH}px`;
    art.style.minHeight = `${artH}px`;
    art.style.overflow = "hidden";
    const stage = art.querySelector<HTMLElement>(".card-art-stage");
    const img = art.querySelector<HTMLElement>(".card-art-image");
    if (stage) {
      stage.style.height = "100%";
      stage.style.width = "100%";
    }
    if (img) {
      img.style.height = "100%";
      img.style.width = "100%";
      img.style.objectFit = "cover";
    }
    pinBox(lower);
  }
  const scene = card.querySelector<HTMLElement>("[data-back-scene]");
  const backArt = scene?.parentElement;
  if (scene && backArt instanceof HTMLElement) {
    const artH = Math.max(
      Math.round(backArt.getBoundingClientRect().height),
      Math.round(cardHeight * 0.38),
    );
    backArt.style.height = `${artH}px`;
    backArt.style.minHeight = `${artH}px`;
    backArt.style.overflow = "hidden";
    scene.style.position = "absolute";
    scene.style.inset = "0";
    scene.style.width = "100%";
    scene.style.height = "100%";
    scene.style.objectFit = "cover";
  }
}

export async function nodeToPng(
  node: HTMLElement,
  options?: {
    pixelRatio?: number;
    backgroundColor?: string;
    width?: number;
    height?: number;
  },
): Promise<string> {
  await document.fonts.ready.catch(() => undefined);
  // Ensure images inside the node have loaded
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
    ),
  );

  const backgroundColor = options?.backgroundColor ?? "#ffffff";
  const width = options?.width ?? Math.ceil(node.offsetWidth);
  const height = options?.height ?? Math.ceil(node.offsetHeight);
  const pixelRatio = options?.pixelRatio ?? 3;
  const root = document.documentElement;
  root.classList.add("exporting-card");
  const snap = {
    cacheBust: true,
    pixelRatio,
    backgroundColor,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    style: {
      transform: "none",
      animation: "none",
      margin: "0",
    },
  };
  try {
    try {
      return await toPng(node, { ...snap, skipFonts: false });
    } catch {
      return await toPng(node, { ...snap, skipFonts: true });
    }
  } finally {
    root.classList.remove("exporting-card");
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** PNG File for the system share sheet. The caller taps share after this exists. */
export function pngFileFromDataUrl(dataUrl: string, filename: string): File {
  const comma = dataUrl.indexOf(",");
  const header = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = /data:(.*?);/i.exec(header)?.[1] || "image/png";
  if (mime !== "image/png") {
    throw new Error(`Expected a PNG, got ${mime}.`);
  }
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: "image/png" });
}

/** True when this browser can hand a PNG file to the system share sheet. */
export function canShareImageFile(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    const probe = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "card.png", {
      type: "image/png",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Front and back as two separate cards on a white image.
 * Gap matches the PDF (14 mm beside an 88.9 mm card) so the cards cannot touch.
 */
export async function stitchPngsSideBySide(
  leftPng: string,
  rightPng: string,
): Promise<string> {
  const [left, right] = await Promise.all([
    loadImage(leftPng),
    loadImage(rightPng),
  ]);
  const cardH = Math.max(left.height, right.height, 1);
  const leftW = Math.round(cardH * (left.width / left.height));
  const rightW = Math.round(cardH * (right.width / right.height));
  const gap = Math.round(cardH * (14 / 88.9));
  const pad = Math.round(cardH * 0.04);
  const width = pad + leftW + gap + rightW + pad;
  const height = pad + cardH + pad;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for export.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const paint = (img: CanvasImageSource, x: number, w: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, pad, w, cardH);
    ctx.clip();
    ctx.drawImage(img, x, pad, w, cardH);
    ctx.restore();
  };
  paint(left, pad, leftW);
  paint(right, pad + leftW + gap, rightW);
  return canvas.toDataURL("image/png");
}

/** Stack print-pair pages into one image, top to bottom. */
export async function stitchPngsStacked(pngs: string[]): Promise<string> {
  if (!pngs.length) throw new Error("Nothing to stitch.");
  const imgs = await Promise.all(pngs.map(loadImage));
  const width = Math.max(...imgs.map((img) => img.width), 1);
  const gap = Math.round(width * 0.03);
  const heights = imgs.map((img) =>
    Math.round(img.height * (width / img.width)),
  );
  const height =
    heights.reduce((sum, h) => sum + h, 0) + gap * (imgs.length - 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for export.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  imgs.forEach((img, i) => {
    const h = heights[i]!;
    ctx.drawImage(img, 0, y, width, h);
    y += h + gap;
  });
  return canvas.toDataURL("image/png");
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for PDF"));
    img.src = dataUrl;
  });
}

/**
 * Standard Pokémon / TCG sleeve size (2.5 × 3.5 in).
 * Cards are placed at this size on A4 — print at 100% / actual size.
 */
export const POKEMON_CARD_MM = { width: 63.5, height: 88.9 } as const;

/** Gap between front and back so the two cards never share an edge. */
const CARD_GAP_MM = 14;

/** Where each card sits on an A4 page, in millimetres. */
export function cardSlotsOnA4(count: number, pageW = 210, pageH = 297) {
  const n = Math.min(Math.max(count, 1), 2);
  const { width: cardW, height: cardH } = POKEMON_CARD_MM;
  const totalW = n * cardW + (n - 1) * CARD_GAP_MM;
  const x0 = (pageW - totalW) / 2;
  const y = (pageH - cardH) / 2 - 4;
  return Array.from({ length: n }, (_, i) => ({
    x: x0 + i * (cardW + CARD_GAP_MM),
    y,
    w: cardW,
    h: cardH,
  }));
}

/** One or two card PNGs → A4 PDF at real Pokémon card size. */
export async function downloadPdfFromPngs(
  pngs: string[],
  filename: string,
  opts?: { caption?: string },
) {
  if (!pngs.length) throw new Error("Nothing to put in the PDF.");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const slots = cardSlotsOnA4(pngs.length, pageW, pageH);

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    doc.addImage(pngs[i]!, "PNG", slot.x, slot.y, slot.w, slot.h);
  }

  const last = slots[slots.length - 1]!;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  const caption =
    opts?.caption ??
    (slots.length > 1
      ? "Front  ·  Back     Print at 100% (actual size)  ·  63.5 × 88.9 mm"
      : "Print at 100% (actual size)  ·  63.5 × 88.9 mm");
  doc.text(caption, pageW / 2, last.y + last.h + 8, { align: "center" });

  const safe = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;
  doc.save(safe);
}

/**
 * One generated print-pair sheet per A4 page.
 * Sheets are laid out at 210 mm wide with 63.5 × 88.9 mm cards, so placing
 * each image at full page width keeps sleeve size. Print at 100%.
 */
export async function downloadPdfPages(pngs: string[], filename: string) {
  if (!pngs.length) throw new Error("Nothing to put in the PDF.");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 0; i < pngs.length; i++) {
    if (i > 0) doc.addPage();
    const img = await loadImage(pngs[i]!);
    const aspect = img.width / Math.max(img.height, 1);
    let w = pageW;
    let h = w / aspect;
    if (h > pageH) {
      h = pageH;
      w = h * aspect;
    }
    const x = (pageW - w) / 2;
    const y = Math.max(0, (pageH - h) / 2);
    doc.addImage(pngs[i]!, "PNG", x, y, w, h);
  }

  const safe = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;
  doc.save(safe);
}

/**
 * Print card images from a hidden iframe.
 * A popup opened after the PNG capture is blocked (and `noopener` returns no
 * window), so the system print dialog is triggered from this page instead.
 */
export async function printDataUrls(
  pngs: string[],
  opts?: { title?: string },
) {
  if (!pngs.length) throw new Error("Nothing to print.");
  const title = opts?.title || "Print Dana Card";
  const imgs = pngs
    .map(
      (src, i) => `<img src="${src}" alt="Card ${i + 1}" class="card" />`,
    )
    .join("\n");
  const note =
    pngs.length > 1
      ? "Front · Back · Print at 100% (actual size) · 63.5 × 88.9 mm"
      : "Print at 100% (actual size) · 63.5 × 88.9 mm";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-card-print", "1");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error("Could not open the print view.");
  }

  doc.open();
  doc.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      html, body { margin: 0; background: #fff; }
      .wrap { display: flex; flex-wrap: nowrap; gap: 14mm; justify-content: center; align-items: flex-start; padding-top: 18mm; }
      .card { width: 63.5mm; height: 88.9mm; flex: 0 0 auto; object-fit: fill; display: block; }
      .note { margin-top: 8mm; text-align: center; font: 9pt Helvetica, Arial, sans-serif; color: #333; }
    </style></head><body>
    <div class="wrap">${imgs}</div>
    <p class="note">${note}</p>
    </body></html>`);
  doc.close();

  const images = Array.from(doc.images);
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
  win.focus();
  win.print();
  win.addEventListener(
    "afterprint",
    () => {
      iframe.remove();
    },
    { once: true },
  );
}

/** Print generated pair sheets, one A4 page each, at the sheet's real size. */
export async function printPageImages(
  pngs: string[],
  opts?: { title?: string },
) {
  if (!pngs.length) throw new Error("Nothing to print.");
  const title = opts?.title || "Print pairs";
  const imgs = pngs
    .map(
      (src, i) => `<img src="${src}" alt="Print pair ${i + 1}" class="page" />`,
    )
    .join("\n");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-card-print", "1");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error("Could not open the print view.");
  }

  doc.open();
  doc.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; background: #fff; }
      .page { width: 210mm; height: auto; display: block; margin: 0 auto; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    </style></head><body>
    ${imgs}
    </body></html>`);
  doc.close();

  const images = Array.from(doc.images);
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
  win.focus();
  win.print();
  win.addEventListener(
    "afterprint",
    () => {
      iframe.remove();
    },
    { once: true },
  );
}

export async function printDataUrl(dataUrl: string) {
  await printDataUrls([dataUrl]);
}

export async function printNode(node: HTMLElement) {
  const dataUrl = await nodeToPng(node, { pixelRatio: 2 });
  await printDataUrl(dataUrl);
}
