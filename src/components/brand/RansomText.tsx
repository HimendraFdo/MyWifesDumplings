import { cn } from "@/lib/utils";

interface RansomTextProps {
  text: string;
  className?: string;
}

/**
 * Renders a string in the same ransom-note / magazine-cutout style as the
 * "meNu" badge: each letter alternates between the two ransom typefaces
 * (Special Elite + Boogaloo) with subtle per-letter rotation and the
 * occasional red accent. Whole words are kept together so headings still wrap
 * cleanly and stay readable.
 */
export function RansomText({ text, className }: RansomTextProps) {
  const words = text.split(" ");
  let letterIndex = 0;

  return (
    <span className={cn("inline-flex flex-wrap justify-center gap-x-3", className)} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex" aria-hidden="true">
          {Array.from(word).map((char, ci) => {
            const i = letterIndex++;
            const useBoogaloo = i % 2 === 1;
            // Subtle, deterministic per-letter tilt + baseline jitter.
            const rotate = [-3, 2, -1, 3, -2, 1][i % 6];
            const translateY = [1, -2, 0, 2, -1, 1][i % 6];
            const accent = i % 5 === 2;

            return (
              <span
                key={ci}
                className={cn(
                  "inline-block leading-none select-none",
                  useBoogaloo ? "font-ransom-b" : "font-ransom",
                  accent ? "text-brand-red" : "text-brand-ink"
                )}
                style={{
                  transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
                  fontSize: useBoogaloo ? "1.15em" : "1em",
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
