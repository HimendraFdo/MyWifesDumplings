import * as React from "react";
import { cn } from "@/lib/utils";

/** Brand-styled text input used across the order/auth forms. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border-2 border-brand-ink/15 bg-brand-cream px-3 font-body text-brand-ink",
      "placeholder:text-brand-ink/40",
      "focus-visible:border-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-body text-sm font-semibold text-brand-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Inline form error / status text. */
export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 font-body text-sm text-brand-red">{children}</p>;
}
