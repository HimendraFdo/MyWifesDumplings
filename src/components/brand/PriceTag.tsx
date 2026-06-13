import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  size?: "sm" | "lg";
  className?: string;
}

export function PriceTag({ price, size = "lg", className }: PriceTagProps) {
  return (
    <span
      className={cn(
        "font-display italic text-brand-red font-bold",
        size === "lg" && "text-4xl",
        size === "sm" && "text-xl",
        className
      )}
    >
      ${price.toFixed(2)}
    </span>
  );
}
