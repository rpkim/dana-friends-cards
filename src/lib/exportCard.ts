"use client";

import { toPng } from "html-to-image";

export async function nodeToPng(
  node: HTMLElement,
  options?: { pixelRatio?: number },
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

  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: options?.pixelRatio ?? 2,
      backgroundColor: "#ffffff",
      skipFonts: false,
    });
  } catch {
    // Fallback if font embedding fails
    return toPng(node, {
      cacheBust: true,
      pixelRatio: options?.pixelRatio ?? 2,
      backgroundColor: "#ffffff",
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

export async function printDataUrl(dataUrl: string) {
  const win = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!win) throw new Error("Popup blocked — allow popups to print.");
  win.document.write(`<!doctype html><html><head><title>Print Dana Card</title>
    <style>
      @page { size: A4 landscape; margin: 0.4in; }
      html, body { margin: 0; background: #fff; }
      img { width: 100%; height: auto; display: block; }
    </style></head><body>
    <img src="${dataUrl}" alt="Print sheet" onload="setTimeout(()=>{window.focus();window.print();},250)" />
    </body></html>`);
  win.document.close();
}

export async function printNode(node: HTMLElement) {
  const dataUrl = await nodeToPng(node, { pixelRatio: 2 });
  await printDataUrl(dataUrl);
}
