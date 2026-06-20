import { cn } from "@/lib/utils";
import {
  ChiveSprig,
  SoyBottle,
  CabbageHead,
  PigDeco,
  PorkStrip,
  MeatSlice,
} from "./Decorations";

/**
 * DynamicScatter — the "Dynamic" design layer.
 *
 * Instead of pinning poster art to the left/right edges, this overlay flings the
 * menu's cut-out graphics (pork strips, marbled slices, chives, soy bottles,
 * cabbages, flying pigs) across the WHOLE section — corners, mid-field, top and
 * bottom — each at its own rotation and gentle drifting animation. The result is
 * a lively, magazine-collage feel that reads the same anywhere on the page.
 */

type DecoKind =
  | "pork"
  | "slice"
  | "chive"
  | "soy"
  | "cabbage"
  | "pig";

const DECO: Record<DecoKind, (cls: string) => React.ReactNode> = {
  pork: (cls) => <PorkStrip className={cls} />,
  slice: (cls) => <MeatSlice className={cls} />,
  chive: (cls) => <ChiveSprig className={cls} />,
  soy: (cls) => <SoyBottle className={cls} />,
  cabbage: (cls) => <CabbageHead className={cls} />,
  pig: (cls) => <PigDeco className={cls} />,
};

type Anim = "float" | "sway" | "drift";

// Literal class names so Tailwind's content scanner keeps them in the build.
const ANIM_CLASS: Record<Anim, string> = {
  float: "animate-float",
  sway: "animate-sway",
  drift: "animate-drift",
};

interface Placement {
  kind: DecoKind;
  /** Inset positions as Tailwind classes, e.g. "top-8 left-[12%]". */
  pos: string;
  /** Size classes for the svg. */
  size: string;
  rot: number;
  anim: Anim;
  opacity: number;
  /** Optional responsive hide — many accents only show on larger screens. */
  show?: string;
  delay?: number;
}

/**
 * Curated, deterministic scatter layouts per section. Positions are spread
 * across the full field (not just the edges) so art appears "here and there".
 */
const VARIANTS: Record<string, Placement[]> = {
  hero: [
    { kind: "pork", pos: "top-[14%] left-[6%]", size: "w-12 h-36", rot: -14, anim: "drift", opacity: 0.85, show: "hidden sm:block" },
    { kind: "soy", pos: "top-[20%] right-[8%]", size: "w-9 h-20", rot: 10, anim: "float", opacity: 0.8, show: "hidden sm:block", delay: 0.6 },
    { kind: "slice", pos: "top-[8%] left-[34%]", size: "w-16 h-14", rot: 8, anim: "sway", opacity: 0.55, show: "hidden md:block", delay: 1.2 },
    { kind: "chive", pos: "bottom-[8%] left-[4%] sm:left-[18%]", size: "w-7 h-24 sm:w-10 sm:h-32", rot: 6, anim: "sway", opacity: 0.55, delay: 0.3 },
    { kind: "cabbage", pos: "bottom-[14%] right-[14%]", size: "w-14 h-14", rot: -6, anim: "float", opacity: 0.5, show: "hidden md:block", delay: 0.9 },
    { kind: "pig", pos: "bottom-[5%] right-[4%] sm:right-[6%]", size: "w-12 h-9 sm:w-16 sm:h-12", rot: 4, anim: "drift", opacity: 0.6, delay: 1.5 },
    { kind: "slice", pos: "top-[40%] right-[4%]", size: "w-12 h-11", rot: -12, anim: "float", opacity: 0.4, show: "hidden lg:block", delay: 2 },
  ],
  menu: [
    { kind: "pork", pos: "top-[5%] left-[2%] sm:left-[4%]", size: "w-7 h-24 sm:w-11 sm:h-32", rot: -10, anim: "drift", opacity: 0.5 },
    { kind: "pork", pos: "bottom-[6%] right-[2%] sm:right-[5%]", size: "w-7 h-24 sm:w-11 sm:h-32", rot: 12, anim: "drift", opacity: 0.5, delay: 1.4 },
    { kind: "slice", pos: "top-[44%] left-[8%]", size: "w-14 h-12", rot: 14, anim: "sway", opacity: 0.45, show: "hidden lg:block", delay: 0.8 },
    { kind: "soy", pos: "top-[12%] right-[10%]", size: "w-8 h-18", rot: -8, anim: "float", opacity: 0.4, show: "hidden lg:block", delay: 0.4 },
    { kind: "chive", pos: "bottom-[16%] left-[12%]", size: "w-9 h-28", rot: -6, anim: "sway", opacity: 0.4, show: "hidden lg:block", delay: 1.1 },
    { kind: "pig", pos: "top-[50%] right-[6%]", size: "w-14 h-10", rot: -4, anim: "drift", opacity: 0.45, show: "hidden lg:block", delay: 1.8 },
  ],
  pricing: [
    { kind: "slice", pos: "top-[6%] left-[3%] sm:top-[10%] sm:left-[6%]", size: "w-11 h-10 sm:w-16 sm:h-14", rot: -12, anim: "float", opacity: 0.38 },
    { kind: "cabbage", pos: "bottom-[10%] left-[10%]", size: "w-16 h-16", rot: 8, anim: "sway", opacity: 0.35, show: "hidden md:block", delay: 0.9 },
    { kind: "soy", pos: "top-[14%] right-[7%]", size: "w-10 h-22", rot: 9, anim: "float", opacity: 0.35, show: "hidden md:block", delay: 0.5 },
    { kind: "pork", pos: "bottom-[14%] right-[6%]", size: "w-11 h-32", rot: -10, anim: "drift", opacity: 0.4, show: "hidden lg:block", delay: 1.3 },
    { kind: "pig", pos: "top-[46%] left-[3%]", size: "w-14 h-10", rot: 6, anim: "drift", opacity: 0.4, show: "hidden lg:block", delay: 1.6 },
  ],
  about: [
    { kind: "chive", pos: "top-[8%] left-[8%]", size: "w-10 h-32", rot: -8, anim: "sway", opacity: 0.35, show: "hidden md:block" },
    { kind: "cabbage", pos: "bottom-[12%] right-[9%]", size: "w-14 h-14", rot: 7, anim: "float", opacity: 0.3, show: "hidden md:block", delay: 0.7 },
    { kind: "slice", pos: "top-[16%] right-[6%]", size: "w-12 h-11", rot: 12, anim: "drift", opacity: 0.3, show: "hidden lg:block", delay: 1.2 },
    { kind: "pork", pos: "bottom-[10%] left-[6%]", size: "w-10 h-28", rot: 10, anim: "drift", opacity: 0.3, show: "hidden lg:block", delay: 1.5 },
  ],
  contact: [
    { kind: "pig", pos: "top-[8%] left-[3%] sm:top-[12%] sm:left-[8%]", size: "w-12 h-9 sm:w-16 sm:h-12", rot: -6, anim: "drift", opacity: 0.4 },
    { kind: "soy", pos: "top-[16%] right-[10%]", size: "w-9 h-20", rot: 8, anim: "float", opacity: 0.35, show: "hidden md:block", delay: 0.6 },
    { kind: "slice", pos: "bottom-[14%] left-[14%]", size: "w-14 h-12", rot: -10, anim: "sway", opacity: 0.35, show: "hidden md:block", delay: 1 },
    { kind: "pork", pos: "bottom-[10%] right-[8%]", size: "w-11 h-32", rot: 12, anim: "drift", opacity: 0.35, show: "hidden md:block", delay: 1.4 },
  ],
  gallery: [
    { kind: "chive", pos: "top-[10%] right-[5%]", size: "w-10 h-30", rot: 8, anim: "sway", opacity: 0.35, show: "hidden md:block" },
    { kind: "slice", pos: "bottom-[12%] left-[5%]", size: "w-14 h-12", rot: -12, anim: "float", opacity: 0.35, show: "hidden md:block", delay: 0.8 },
    { kind: "pork", pos: "top-[40%] left-[3%]", size: "w-10 h-28", rot: -8, anim: "drift", opacity: 0.3, show: "hidden lg:block", delay: 1.3 },
    { kind: "soy", pos: "bottom-[16%] right-[7%]", size: "w-9 h-20", rot: 10, anim: "float", opacity: 0.3, show: "hidden lg:block", delay: 1.6 },
  ],
};

interface DynamicScatterProps {
  variant: keyof typeof VARIANTS;
  className?: string;
}

export function DynamicScatter({ variant, className }: DynamicScatterProps) {
  const items = VARIANTS[variant] ?? [];
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={cn("absolute", it.pos, it.show)}
          style={{
            // Drive rotation through a CSS var so the keyframes layer motion on top.
            ["--deco-rot" as string]: `${it.rot}deg`,
            opacity: it.opacity,
          }}
        >
          <div
            className={cn(ANIM_CLASS[it.anim], "motion-reduce:animate-none")}
            style={{ animationDelay: it.delay ? `${it.delay}s` : undefined }}
          >
            {DECO[it.kind](
              cn(it.size, "drop-shadow-[1px_2px_0_rgba(146,43,33,0.25)]"),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
