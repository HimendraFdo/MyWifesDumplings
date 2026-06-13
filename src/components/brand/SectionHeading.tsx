import { cn } from "@/lib/utils";
import { RansomText } from "./RansomText";

interface SectionHeadingProps {
  children: React.ReactNode;
  subheading?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  children,
  subheading,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-3", align === "center" && "text-center", className)}>
      <h2
        className={cn(
          "text-4xl md:text-5xl text-brand-ink leading-tight",
          typeof children !== "string" && "font-display italic"
        )}
      >
        {typeof children === "string" ? <RansomText text={children} /> : children}
      </h2>
      {/* Red brushstroke-style underline */}
      <div
        className={cn(
          "mx-auto h-1 w-20 bg-brand-red rounded-full",
          "[border-radius:2px_5px_3px_4px/4px_3px_5px_2px]",
          align === "left" && "mx-0"
        )}
      />
      {subheading && (
        <p className="font-body text-base text-brand-ink/70 max-w-md mx-auto">
          {subheading}
        </p>
      )}
    </div>
  );
}
