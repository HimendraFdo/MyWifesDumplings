import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderButtonProps {
  href: string;
  children?: React.ReactNode;
  size?: "sm" | "lg";
  className?: string;
}

export function OrderButton({
  href,
  children = "Order Now",
  size = "lg",
  className,
}: OrderButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-block font-body font-bold tracking-wider uppercase cursor-pointer",
        "bg-brand-red text-brand-cream",
        "border-2 border-brand-red-dark",
        "[border-radius:3px_8px_4px_7px/7px_4px_8px_3px]",
        "transition-all duration-150",
        "hover:bg-brand-red-dark hover:shadow-md active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        size === "lg" && "px-8 py-4 text-base",
        size === "sm" && "px-5 py-2.5 text-sm",
        className
      )}
    >
      {children}
    </Link>
  );
}
