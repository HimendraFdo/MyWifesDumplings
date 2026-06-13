import { cn } from "@/lib/utils";

interface StampBadgeProps {
  children: React.ReactNode;
  variant?: "red" | "outline";
  className?: string;
}

export function StampBadge({ children, variant = "red", className }: StampBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-3 py-0.5 text-xs font-body font-semibold tracking-widest uppercase",
        "border-2 select-none",
        "[border-radius:3px_8px_4px_7px/7px_4px_8px_3px]",
        variant === "red" && "bg-brand-red text-brand-cream border-brand-red-dark",
        variant === "outline" && "bg-transparent text-brand-red border-brand-red",
        className
      )}
    >
      {children}
    </span>
  );
}
