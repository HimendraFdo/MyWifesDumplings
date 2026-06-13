import { cn } from "@/lib/utils";

interface DecoProps {
  className?: string;
}

/** Long bundle of chive/spring onion stalks — matches the poster border illustration */
export function ChiveSprig({ className }: DecoProps) {
  return (
    <svg
      viewBox="0 0 80 220"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-brand-red", className)}
      aria-hidden="true"
    >
      {/* Left stalk */}
      <path d="M 18 220 L 20 90 Q 14 70 10 40 Q 8 20 14 8 Q 18 2 22 8 Q 26 18 24 42 Q 22 68 24 90 L 26 220 Z" />
      {/* Left stalk texture lines */}
      <line x1="21" y1="200" x2="21" y2="100" stroke="#F5E6D3" strokeWidth="0.8" opacity="0.4" />
      {/* Left leaf */}
      <path d="M 18 140 Q 2 120 4 95 Q 6 80 16 90 Q 20 110 22 140 Z" />
      <path d="M 24 160 Q 42 138 40 112 Q 38 96 28 108 Q 24 128 24 160 Z" />

      {/* Center stalk (tallest) */}
      <path d="M 34 220 L 36 80 Q 30 58 28 28 Q 26 8 32 2 Q 36 -2 40 2 Q 44 10 42 30 Q 40 60 40 80 L 44 220 Z" />
      <line x1="39" y1="200" x2="39" y2="88" stroke="#F5E6D3" strokeWidth="0.8" opacity="0.4" />
      {/* Center leaves */}
      <path d="M 36 130 Q 18 108 20 82 Q 22 66 32 78 Q 36 98 38 130 Z" />
      <path d="M 40 150 Q 60 128 58 100 Q 56 84 46 96 Q 40 116 40 150 Z" />

      {/* Right stalk */}
      <path d="M 52 220 L 54 100 Q 50 80 48 52 Q 46 32 52 22 Q 56 16 60 22 Q 64 32 62 54 Q 60 80 60 100 L 62 220 Z" />
      <line x1="57" y1="200" x2="57" y2="108" stroke="#F5E6D3" strokeWidth="0.8" opacity="0.4" />
      {/* Right leaf */}
      <path d="M 54 155 Q 36 135 38 108 Q 40 92 50 104 Q 54 122 56 155 Z" />
      <path d="M 58 170 Q 76 150 74 124 Q 72 108 62 120 Q 58 138 58 170 Z" />

      {/* Root cluster at bottom */}
      <ellipse cx="39" cy="218" rx="22" ry="5" />
    </svg>
  );
}

/** Traditional Japanese/Chinese soy sauce bottle silhouette */
export function SoyBottle({ className }: DecoProps) {
  return (
    <svg
      viewBox="0 0 70 120"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-brand-red", className)}
      aria-hidden="true"
    >
      {/* Bottle body */}
      <path d="M 15 115 Q 5 100 5 80 Q 5 60 15 55 L 18 45 Q 20 38 20 30 L 20 20 Q 20 15 22 12 L 22 8 Q 22 4 35 4 Q 48 4 48 8 L 48 12 Q 50 15 50 20 L 50 30 Q 50 38 52 45 L 55 55 Q 65 60 65 80 Q 65 100 55 115 Z" />
      {/* Waist indent */}
      <path d="M 20 30 Q 10 36 10 42 Q 10 48 20 50 L 50 50 Q 60 48 60 42 Q 60 36 50 30 Z" fill="#F5E6D3" opacity="0.25" />
      {/* Cap */}
      <rect x="28" y="2" width="14" height="8" rx="4" />
      {/* "SOY" label area */}
      <rect x="18" y="68" width="34" height="20" rx="3" fill="#F5E6D3" opacity="0.2" />
      <text x="35" y="82" textAnchor="middle" fill="#F5E6D3" fontSize="8" fontFamily="serif" letterSpacing="1">SOY</text>
      {/* Highlight line */}
      <path d="M 18 60 Q 18 80 20 95" stroke="#F5E6D3" strokeWidth="2" fill="none" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

/** Round Chinese napa cabbage head */
export function CabbageHead({ className }: DecoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-brand-red", className)}
      aria-hidden="true"
    >
      {/* Outer leaf layer */}
      <ellipse cx="60" cy="65" rx="52" ry="48" />
      {/* Leaf texture lines on outer */}
      <path d="M 60 20 Q 60 65 60 112" stroke="#F5E6D3" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M 30 28 Q 45 65 40 108" stroke="#F5E6D3" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M 90 28 Q 75 65 80 108" stroke="#F5E6D3" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M 12 55 Q 60 50 108 55" stroke="#F5E6D3" strokeWidth="1" fill="none" opacity="0.2" />

      {/* Second leaf layer */}
      <ellipse cx="60" cy="68" rx="40" ry="36" fill="#C0392B" />
      <path d="M 60 36 Q 60 68 60 104" stroke="#F5E6D3" strokeWidth="1.2" fill="none" opacity="0.4" />
      <path d="M 38 42 Q 50 68 46 102" stroke="#F5E6D3" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M 82 42 Q 70 68 74 102" stroke="#F5E6D3" strokeWidth="0.8" fill="none" opacity="0.3" />

      {/* Inner core */}
      <ellipse cx="60" cy="70" rx="26" ry="22" fill="#A93226" />
      <path d="M 60 50 Q 60 70 60 92" stroke="#F5E6D3" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Base/stem */}
      <ellipse cx="60" cy="110" rx="14" ry="6" fill="#922B21" />
    </svg>
  );
}

/** Small flying/jumping pig used as a decorative accent */
export function PigDeco({ className, flipped = false }: DecoProps & { flipped?: boolean }) {
  return (
    <svg
      viewBox="0 0 90 60"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-brand-red", className, flipped && "scale-x-[-1]")}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="45" cy="38" rx="28" ry="18" />
      {/* Head */}
      <circle cx="68" cy="28" r="16" />
      {/* Ear */}
      <ellipse cx="62" cy="14" rx="7" ry="10" transform="rotate(-15 62 14)" />
      <ellipse cx="76" cy="12" rx="6" ry="8" transform="rotate(10 76 12)" />
      {/* Snout */}
      <ellipse cx="80" cy="32" rx="9" ry="7" fill="#A93226" />
      <circle cx="77" cy="32" r="2" fill="#F5E6D3" />
      <circle cx="83" cy="32" r="2" fill="#F5E6D3" />
      {/* Eye */}
      <circle cx="73" cy="24" r="2.5" fill="#F5E6D3" />
      <circle cx="73.5" cy="24.5" r="1.2" fill="#1A0A00" />
      {/* Front legs */}
      <rect x="36" y="50" width="9" height="10" rx="4.5" />
      <rect x="50" y="52" width="9" height="8" rx="4" />
      {/* Back leg */}
      <rect x="20" y="50" width="9" height="10" rx="4.5" />
      {/* Tail */}
      <path d="M 18 36 C 8 30 5 40 12 42 C 18 44 18 38 14 37" stroke="#C0392B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Wings/ears suggesting movement */}
      <path d="M 30 28 Q 18 16 22 8 Q 26 4 32 14 Q 34 22 32 30 Z" />
      <path d="M 38 24 Q 28 10 32 4 Q 36 0 42 10 Q 44 18 42 26 Z" />
    </svg>
  );
}

/** Horizontal decorative chive cluster for dividers */
export function ChiveCluster({ className }: DecoProps) {
  return (
    <svg
      viewBox="0 0 160 50"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-brand-red", className)}
      aria-hidden="true"
    >
      <path d="M 20 50 L 22 30 Q 16 20 14 8 Q 14 2 18 2 Q 22 2 22 8 Q 22 20 24 30 L 26 50 Z" />
      <path d="M 18 32 Q 6 26 6 18 Q 6 12 14 18 Q 16 24 18 32 Z" />
      <path d="M 24 36 Q 36 30 36 22 Q 36 16 28 22 Q 26 28 24 36 Z" />

      <path d="M 50 50 L 52 22 Q 46 12 44 2 Q 44 -2 48 0 Q 52 2 52 8 Q 52 18 54 24 L 58 50 Z" />
      <path d="M 50 28 Q 38 22 38 14 Q 38 8 46 14 Q 48 20 50 28 Z" />
      <path d="M 54 32 Q 66 26 66 18 Q 66 12 58 18 Q 56 24 54 32 Z" />

      <path d="M 78 50 L 80 18 Q 74 8 72 -2 Q 72 -6 76 -4 Q 80 0 80 6 Q 80 16 82 20 L 86 50 Z" />
      <path d="M 78 24 Q 66 18 66 10 Q 66 4 74 10 Q 76 16 78 24 Z" />
      <path d="M 82 28 Q 94 22 94 14 Q 94 8 86 14 Q 84 20 82 28 Z" />

      <path d="M 106 50 L 108 28 Q 102 18 100 6 Q 100 0 104 2 Q 108 4 108 10 Q 108 22 110 28 L 114 50 Z" />
      <path d="M 106 32 Q 94 26 94 18 Q 94 12 102 18 Q 104 24 106 32 Z" />
      <path d="M 110 36 Q 122 30 122 22 Q 122 16 114 22 Q 112 28 110 36 Z" />

      <path d="M 132 50 L 134 34 Q 128 24 126 14 Q 126 8 130 10 Q 134 12 134 18 Q 134 28 136 34 L 140 50 Z" />
      <path d="M 132 38 Q 120 32 120 24 Q 120 18 128 24 Q 130 30 132 38 Z" />
      <path d="M 136 42 Q 148 36 148 28 Q 148 22 140 28 Q 138 34 136 42 Z" />
    </svg>
  );
}
