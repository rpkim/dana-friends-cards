"use client";

import Link from "next/link";

const PAGES = [
  {
    src: "/coloring/dana-portrait.png",
    file: "dana-portrait.png",
    title: "Dana",
    alt: "Coloring page of Dana, a smiling girl with bangs and a heart on her hoodie.",
  },
  {
    src: "/coloring/dana-friends-play.png",
    file: "dana-friends-play.png",
    title: "Playing together",
    alt: "Coloring page of Dana and two friends playing with a big ball.",
  },
  {
    src: "/coloring/dana-birthday.png",
    file: "dana-birthday.png",
    title: "Birthday",
    alt: "Coloring page of Dana and friends around a birthday cake with balloons.",
  },
  {
    src: "/coloring/dana-outdoor.png",
    file: "dana-outdoor.png",
    title: "Outdoor play",
    alt: "Coloring page of Dana on a swing and a friend waving at the playground.",
  },
] as const;

function printColoringPages(srcs: readonly string[]) {
  document.querySelectorAll("[data-coloring-print]").forEach((node) => {
    node.remove();
  });

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-coloring-print", "");
  iframe.title = "Coloring page print";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  const sheets = srcs
    .map((src) => {
      const url = new URL(src, window.location.href).href;
      return `<section class="sheet"><img src="${url}" alt="" /></section>`;
    })
    .join("");

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Dana & Friends Coloring</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .sheet {
    box-sizing: border-box;
    width: 190mm;
    height: 277mm;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    break-after: page;
    page-break-after: always;
  }
  .sheet:last-child { break-after: auto; page-break-after: auto; }
  img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    background: #fff;
  }
</style>
</head>
<body>${sheets}</body>
</html>`);
  doc.close();

  const images = Array.from(doc.images);
  const ready = Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  void ready.then(() => {
    const cleanup = () => iframe.remove();
    win.addEventListener("afterprint", cleanup, { once: true });
    win.focus();
    win.print();
    window.setTimeout(cleanup, 120000);
  });
}

const tap =
  "inline-flex min-h-14 items-center justify-center rounded-2xl px-4 text-lg font-extrabold touch-manipulation";

export function ColoringGallery() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl leading-tight text-[var(--ink)]">
          Dana & Friends Coloring
        </h1>
        <p className="text-lg font-bold leading-snug text-[var(--ink)]">
          Easy pages for kids to color. Download a picture or print it.
        </p>
      </div>

      <button
        type="button"
        className={`${tap} bg-[var(--ink)] text-white`}
        onClick={() => printColoringPages(PAGES.map((page) => page.src))}
      >
        Print all
      </button>

      <div className="flex flex-col gap-8">
        {PAGES.map((page) => (
          <article
            key={page.file}
            className="overflow-hidden rounded-3xl bg-white shadow-md"
          >
            <img
              src={page.src}
              alt={page.alt}
              width={1728}
              height={2304}
              className="block h-auto w-full bg-white"
            />
            <div className="flex flex-col gap-3 p-4">
              <h2 className="font-display text-2xl text-[var(--ink)]">
                {page.title}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={page.src}
                  download={page.file}
                  aria-label={`Download ${page.title}`}
                  className={`${tap} border-2 border-[var(--ink)] bg-white text-[var(--ink)]`}
                >
                  Download
                </a>
                <button
                  type="button"
                  aria-label={`Print ${page.title}`}
                  className={`${tap} bg-[var(--ink)] text-white`}
                  onClick={() => printColoringPages([page.src])}
                >
                  Print
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Link
        href="/"
        className="self-start text-lg font-extrabold text-[var(--ink)] underline decoration-2 underline-offset-4"
      >
        Card studio
      </Link>
    </main>
  );
}
