import type { Theme } from "@/lib/themes";

type Props = {
  motif: Theme["motif"];
  size?: number;
  className?: string;
};

/** Original Dana & Friends motifs — stars, bolts, leaves, aura rings (no trademark balls). */
export function MotifIcon({ motif, size = 16, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true as const,
  };

  if (motif === "bolt") {
    return (
      <svg {...common}>
        <path
          d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
          fill="#FFE56A"
          stroke="#1a1a1a"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (motif === "leaf") {
    return (
      <svg {...common}>
        <path
          d="M12 3c6 2 9 8 8 14-5 1-10-2-12-7 2-1 4-1 4-1S8 14 6 17c-1-5 1-11 6-14z"
          fill="#E87722"
          stroke="#1a1a1a"
          strokeWidth="1.2"
        />
        <path d="M12 8v10" stroke="#1a1a1a" strokeWidth="1.2" />
      </svg>
    );
  }
  if (motif === "aura") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill="none" stroke="#6EB6FF" strokeWidth="2.5" />
        <circle cx="12" cy="12" r="3.5" fill="#3D7CFF" stroke="#061433" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M12 2l2.2 5.4L20 9l-4.2 3.6L17 19l-5-3-5 3 1.2-6.4L4 9l5.8-1.6L12 2z"
        fill="#FF7AB8"
        stroke="#4A1840"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Original friendship badge (replaces red/white ball icons). */
export function FriendBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFD400" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
