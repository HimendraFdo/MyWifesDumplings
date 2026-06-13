"use client";

import { cn } from "@/lib/utils";

interface RansomBadgeProps {
  className?: string;
}

/**
 * Recreates the "meNu" collage-font badge from the business's Instagram menu card.
 * Each letter uses a different typeface at different sizes, enclosed in a teal border —
 * the same ransom-note / magazine-cutout aesthetic as the original poster.
 */
export function RansomBadge({ className }: RansomBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-[1px] px-5 py-3",
        "bg-[#F5E6A3] border-[5px] border-[#2D6B27]",
        "shadow-[4px_4px_0_#1A3D12]",
        "-rotate-1",
        className
      )}
      style={{ borderRadius: "6px 16px 10px 14px / 14px 10px 16px 6px" }}
      aria-label="menu"
    >
      {/* m — bold serif (Playfair) */}
      <span
        className="font-display italic text-brand-ink leading-none select-none"
        style={{ fontSize: "2.6rem", transform: "rotate(-2deg) translateY(2px)" }}
        aria-hidden="true"
      >
        m
      </span>

      {/* e — ransom typewriter, pink/magenta */}
      <span
        className="font-ransom leading-none select-none"
        style={{
          fontSize: "2rem",
          color: "#D63E8A",
          transform: "rotate(3deg) translateY(-3px)",
        }}
        aria-hidden="true"
      >
        e
      </span>

      {/* N — very large bold ransom-b */}
      <span
        className="font-ransom-b leading-none select-none"
        style={{
          fontSize: "3.2rem",
          color: "#1A0A00",
          transform: "rotate(-1deg) translateY(4px)",
          fontWeight: 700,
        }}
        aria-hidden="true"
      >
        N
      </span>

      {/* u — ransom typewriter */}
      <span
        className="font-ransom leading-none select-none"
        style={{
          fontSize: "2.2rem",
          color: "#C0392B",
          transform: "rotate(2deg) translateY(0px)",
        }}
        aria-hidden="true"
      >
        u
      </span>
    </div>
  );
}
