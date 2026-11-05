"use client";

import type { StatusMsg } from "@/lib/statusCopy";

export function StatusBanner({ status }: { status: StatusMsg }) {
  const tone =
    status.kind === "billing"
      ? "bg-amber-100 text-amber-950 border-amber-300"
      : status.kind === "success" || status.kind === "ready"
        ? "bg-emerald-50 text-emerald-950 border-emerald-200"
        : status.kind === "loading"
          ? "bg-sky-50 text-sky-950 border-sky-200"
          : "bg-black/5 text-black/80 border-black/10";

  return (
    <div
      role="status"
      className={`rounded-xl border px-3 py-2 text-xs font-medium ${tone}`}
    >
      <p>{status.en}</p>
      <p className="mt-0.5 opacity-80">{status.ko}</p>
      {status.href && (
        <a
          href={status.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex font-bold underline underline-offset-2"
        >
          {status.hrefLabel || status.href}
        </a>
      )}
    </div>
  );
}
