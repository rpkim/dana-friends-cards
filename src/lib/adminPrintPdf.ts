import { jsPDF } from "jspdf";

/** Sleeve size. The PDF places each card in this box; it does not shrink them to fit. */
export const ADMIN_CARD_MM = { width: 63.5, height: 88.9 } as const;

/** Gap between sleeves on the 3×3 A4 sheet. */
export const ADMIN_GAP_MM = 2;

/**
 * Extra frame color on every side of an extra-back.
 * The picture stays on the sleeve. These plates may meet or overlap in the
 * 2 mm gutter; they are painted before the pictures, so they do not cover art.
 * Clamped only so the plate stays on the A4 page.
 */
export const ADMIN_BACK_BLEED_TARGET_MM = 4;

/**
 * Requested A4. The grid's X is not this constant: it is the media box
 * jsPDF actually writes, converted with 1 pt = 25.4/72 mm.
 */
const PAGE_W = 210;
const PAGE_H = 297;

/** Current page width in millimetres, from the media box (1 pt = 25.4/72 mm). */
function mediaWidthMm(doc: jsPDF) {
  const box = doc.getCurrentPageInfo().pageContext.mediaBox;
  const widthPt = Number(box.topRightX) - Number(box.bottomLeftX);
  return (widthPt * 25.4) / 72;
}

/** Back-page nudge, in whole millimetres. Positive moves the back to the right. */
export const ADMIN_BACK_SHIFT_MIN_MM = -6;
export const ADMIN_BACK_SHIFT_MAX_MM = 6;

export function clampAdminBackShiftMm(value: number) {
  if (!Number.isFinite(value)) return 0;
  const stepped = Math.round(value);
  if (stepped < ADMIN_BACK_SHIFT_MIN_MM) return ADMIN_BACK_SHIFT_MIN_MM;
  if (stepped > ADMIN_BACK_SHIFT_MAX_MM) return ADMIN_BACK_SHIFT_MAX_MM;
  return stepped;
}

export type AdminPrintMode = "exact" | "extra-back";

/**
 * Top-left of a visual slot. Columns are not mirrored here: the back page
 * already lists slots in long-edge order (3 2 1 / 6 5 4 / 9 8 7).
 * X is centered on the media-box width. Y stays on the 297 mm page.
 */
export function adminSlotRect(index: number, shiftXMm = 0, pageWidthMm = PAGE_W) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const { width, height } = ADMIN_CARD_MM;
  const gridW = width * 3 + ADMIN_GAP_MM * 2;
  const gridH = height * 3 + ADMIN_GAP_MM * 2;
  const originX = (pageWidthMm - gridW) / 2 + shiftXMm;
  const originY = (PAGE_H - gridH) / 2;
  return {
    x: originX + col * (width + ADMIN_GAP_MM),
    y: originY + row * (height + ADMIN_GAP_MM),
    w: width,
    h: height,
  };
}

export type AdminPdfPage = {
  /** Sits in the top margin. It is not part of the card grid. */
  label: string;
  /** Nine visual slots. Null leaves that sleeve blank. */
  images: (string | null)[];
  /** Back pages can take extra-back bleed. Fronts always stay on the sleeve. */
  side?: "front" | "back";
  /**
   * RGB 0–255 for each back slot. Extra-back paints a sharp rectangle of this
   * color behind the picture. Null leaves that sleeve with no extra color.
   */
  frameColors?: ([number, number, number] | null)[];
};

/**
 * Millimetres of extra frame color on every side in extra-back mode.
 * 4 mm fits the page (~7.75 mm at the side, ~13.15 mm at the top).
 * The 2 mm gutter is not a limit: neighboring plates may overlap there.
 */
export function adminBackBleedMm(pageWidthMm = PAGE_W) {
  const { width, height } = ADMIN_CARD_MM;
  const gridW = width * 3 + ADMIN_GAP_MM * 2;
  const gridH = height * 3 + ADMIN_GAP_MM * 2;
  const marginX = (pageWidthMm - gridW) / 2;
  const marginY = (PAGE_H - gridH) / 2;
  const pageLimit = Math.min(marginX, marginY);
  const bleed = Math.min(ADMIN_BACK_BLEED_TARGET_MM, pageLimit);
  return Math.max(0, Math.round(bleed * 1000) / 1000);
}

/** Slot rectangle, grown equally on every side so the center stays put. */
export function adminPlacedRect(
  index: number,
  bleedMm = 0,
  shiftXMm = 0,
  pageWidthMm = PAGE_W,
) {
  const slot = adminSlotRect(index, shiftXMm, pageWidthMm);
  return {
    x: slot.x - bleedMm,
    y: slot.y - bleedMm,
    w: slot.w + bleedMm * 2,
    h: slot.h + bleedMm * 2,
  };
}

/** Helvetica in the PDF is WinAnsi. The sheet label uses an em dash on screen. */
function pdfLabel(label: string) {
  return label.replace(/\u2014/g, "-").replace(/[^\x0A\x0D\x20-\xFF]/g, "");
}

export type AdminSheetPdfOptions = {
  /**
   * Millimetres added to every back-page X.
   * Positive moves the back art, and its extra color plate, to the right.
   * The front page and every Y stay put.
   */
  backShiftMm?: number;
};

/**
 * A4 pages with cards at absolute millimetres. Both pages share one origin,
 * so Chrome's window zoom cannot shift the back relative to the front.
 * backShiftMm is the printer's leftover left-right error, applied to backs only.
 */
export function buildAdminSheetPdf(
  pages: AdminPdfPage[],
  mode: AdminPrintMode = "exact",
  options: AdminSheetPdfOptions = {},
) {
  const backShift = clampAdminBackShiftMm(options.backShiftMm ?? 0);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });
  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
    const pageWidth = mediaWidthMm(doc);
    const backBleed = mode === "extra-back" ? adminBackBleedMm(pageWidth) : 0;
    const label = pdfLabel(page.label.trim());
    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(26, 26, 26);
      doc.text(label, pageWidth / 2, 6, { align: "center" });
    }
    const shiftX = page.side === "back" ? backShift : 0;
    const bleed = page.side === "back" ? backBleed : 0;
    if (bleed > 0) {
      page.images.forEach((image, index) => {
        if (!image || index > 8) return;
        const color = page.frameColors?.[index];
        if (!color) return;
        const plate = adminPlacedRect(index, bleed, shiftX, pageWidth);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(plate.x, plate.y, plate.w, plate.h, "F");
      });
    }
    page.images.forEach((image, index) => {
      if (!image || index > 8) return;
      const slot = adminSlotRect(index, shiftX, pageWidth);
      const format = image.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(image, format, slot.x, slot.y, slot.w, slot.h);
    });
  });
  return doc;
}
