import { cn } from "@/lib/utils";

interface RedDividerProps {
  className?: string;
}

export function RedDivider({ className }: RedDividerProps) {
  return (
    <div className={cn("flex items-center gap-4 my-8", className)}>
      <div className="flex-1 h-px bg-brand-red/30" />
      {/* Dumpling SVG icon */}
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-brand-red shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C7 2 3 5.5 3 10c0 2.5 1.2 4.7 3 6.2V18a1 1 0 001 1h10a1 1 0 001-1v-1.8c1.8-1.5 3-3.7 3-6.2 0-4.5-4-8-9-8zm0 2c3.9 0 7 2.7 7 6s-3.1 6-7 6-7-2.7-7-6 3.1-6 7-6z" />
      </svg>
      <div className="flex-1 h-px bg-brand-red/30" />
    </div>
  );
}
