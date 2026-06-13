import { cn } from "@/lib/utils";

interface PigLogoProps {
  className?: string;
  size?: number;
}

export function PigLogo({ className, size = 200 }: PigLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      aria-label="My Wife's Dumplings — pig logo"
      role="img"
    >
      {/* Cream background circle */}
      <circle cx="100" cy="100" r="97" fill="#F5E6D3" />
      <circle cx="100" cy="100" r="97" fill="none" stroke="#C0392B" strokeWidth="2.5" />

      {/* Inner decorative ring */}
      <circle cx="100" cy="100" r="91" fill="none" stroke="#C0392B" strokeWidth="0.8" strokeDasharray="4 6" />

      {/* Body — large dominant round shape */}
      <ellipse cx="100" cy="118" rx="56" ry="48" fill="#C0392B" />

      {/* Head */}
      <circle cx="100" cy="72" r="33" fill="#C0392B" />

      {/* Left ear */}
      <ellipse cx="74" cy="46" rx="13" ry="17" fill="#C0392B" transform="rotate(-22 74 46)" />
      {/* Right ear */}
      <ellipse cx="126" cy="46" rx="13" ry="17" fill="#C0392B" transform="rotate(22 126 46)" />

      {/* Inner ear cutouts */}
      <ellipse cx="74" cy="46" rx="7" ry="10" fill="#F5E6D3" opacity="0.55" transform="rotate(-22 74 46)" />
      <ellipse cx="126" cy="46" rx="7" ry="10" fill="#F5E6D3" opacity="0.55" transform="rotate(22 126 46)" />

      {/* Snout area */}
      <ellipse cx="100" cy="86" rx="20" ry="16" fill="#A93226" />

      {/* Nostrils */}
      <circle cx="92" cy="87" r="4.5" fill="#F5E6D3" />
      <circle cx="108" cy="87" r="4.5" fill="#F5E6D3" />
      <circle cx="92" cy="87" r="2" fill="#922B21" />
      <circle cx="108" cy="87" r="2" fill="#922B21" />

      {/* Eyes */}
      <circle cx="85" cy="64" r="5.5" fill="#F5E6D3" />
      <circle cx="115" cy="64" r="5.5" fill="#F5E6D3" />
      <circle cx="86" cy="65" r="2.5" fill="#1A0A00" />
      <circle cx="116" cy="65" r="2.5" fill="#1A0A00" />
      {/* Eye shine */}
      <circle cx="87.5" cy="63.5" r="1" fill="#F5E6D3" />
      <circle cx="117.5" cy="63.5" r="1" fill="#F5E6D3" />

      {/* Body texture line (woodblock feel) */}
      <path d="M 56 118 Q 100 106 144 118" stroke="#F5E6D3" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M 62 130 Q 100 120 138 130" stroke="#F5E6D3" strokeWidth="1" fill="none" opacity="0.25" />

      {/* Front legs */}
      <rect x="60" y="155" width="19" height="26" rx="9.5" fill="#C0392B" />
      <rect x="86" y="158" width="19" height="23" rx="9.5" fill="#C0392B" />
      {/* Back legs */}
      <rect x="95" y="158" width="19" height="23" rx="9.5" fill="#C0392B" />
      <rect x="121" y="155" width="19" height="26" rx="9.5" fill="#C0392B" />

      {/* Tail — curly */}
      <path
        d="M 155 108 C 172 98 178 115 164 121 C 154 126 153 116 161 114"
        stroke="#C0392B"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Traditional red seal stamp */}
      <rect x="8" y="162" width="30" height="30" rx="3" fill="#C0392B" />
      <text
        x="23"
        y="182"
        textAnchor="middle"
        fill="#F5E6D3"
        fontSize="14"
        fontFamily="serif"
        fontWeight="bold"
      >
        印
      </text>
    </svg>
  );
}
