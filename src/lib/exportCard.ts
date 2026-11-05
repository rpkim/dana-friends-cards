"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function nodeToPng(
  node: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string },
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
  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: options?.pixelRatio ?? 2,
      backgroundColor,
      skipFonts: false,
    });
  } catch {
    // Fallback if font embedding fails
    return toPng(node, {
      cacheBust: true,
      pixelRatio: options?.pixelRatio ?? 2,
      backgroundColor,
      skipFonts: true,
    });
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

/** Side-by-side PNG of front + back for a single download. */
export async function stitchPngsSideBySide(
  leftPng: string,
  rightPng: string,
  gap = 48,
  background = "#ffffff",
): Promise<string> {
  const [left, right] = await Promise.all([
    loadImage(leftPng),
    loadImage(rightPng),
  ]);
  const height = Math.max(left.height, right.height);
  const width = left.width + gap + right.width;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for export.");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(left, 0, (height - left.height) / 2);
  ctx.drawImage(right, left.width + gap, (height - right.height) / 2);
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

/** One or more PNG data URLs → downloadable PDF (A4). */
export async function downloadPdfFromPngs(
  pngs: string[],
  filename: string,
  opts?: { layout?: "portrait" | "landscape" },
) {
  if (!pngs.length) throw new Error("Nothing to put in the PDF.");
  const layout = opts?.layout ?? (pngs.length > 1 ? "landscape" : "portrait");
  const doc = new jsPDF({
    orientation: layout,
    unit: "pt",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 28;

  if (pngs.length === 1) {
    const img = await loadImage(pngs[0]!);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    doc.addImage(pngs[0]!, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  } else {
    // Side-by-side front + back on one landscape page
    const gap = 24;
    const colW = (pageW - margin * 2 - gap) / 2;
    const maxH = pageH - margin * 2;
    for (let i = 0; i < Math.min(2, pngs.length); i++) {
      const img = await loadImage(pngs[i]!);
      const scale = Math.min(colW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = margin + i * (colW + gap) + (colW - w) / 2;
      const y = (pageH - h) / 2;
      doc.addImage(pngs[i]!, "PNG", x, y, w, h);
    }
  }

  const safe = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;
  doc.save(safe);
}

/** Open a print window for one or more PNG data URLs. */
export async function printDataUrls(
  pngs: string[],
  opts?: { title?: string; landscape?: boolean },
) {
  const win = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!win) throw new Error("Popup blocked — allow popups to print.");
  const title = opts?.title || "Print Dana Card";
  const landscape = opts?.landscape ?? pngs.length > 1;
  const imgs = pngs
    .map(
      (src, i) =>
        `<img src="${src}" alt="Card ${i + 1}" class="card" />`,
    )
    .join("\n");
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0.4in; }
      html, body { margin: 0; background: #fff; }
      .wrap { display: flex; gap: 24px; justify-content: center; align-items: center; min-height: 90vh; padding: 12px; box-sizing: border-box; }
      .card { max-width: ${pngs.length > 1 ? "48%" : "100%"}; max-height: 90vh; width: auto; height: auto; display: block; }
      @media print {
        .wrap { min-height: auto; }
      }
    </style></head><body>
    <div class="wrap">${imgs}</div>
    <script>
      const imgs = Array.from(document.images);
      Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })))
        .then(() => setTimeout(() => { window.focus(); window.print(); }, 250));
    </script>
    </body></html>`);
  win.document.close();
}

export async function printDataUrl(dataUrl: string) {
  await printDataUrls([dataUrl]);
}

export async function printNode(node: HTMLElement) {
  const dataUrl = await nodeToPng(node, { pixelRatio: 2 });
  await printDataUrl(dataUrl);
}
