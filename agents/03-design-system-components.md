# Agent 3 — Design System & Brand Components

## Your role
You are the design system agent. Your job is to build all shared, reusable brand components — the visual language of the site. You are building the component primitives that Agents 4, 5, and 6 will use to compose full pages.

Do NOT build any full pages or sections yet.

---

## Brand aesthetic

Study this carefully before writing a single line of CSS:

- **Logo:** Stamp-like pig illustration inside a circular red border — folk-art / linocut style
- **Illustrations:** Hand-drawn red Chinese folk-art motifs (chives, cabbage, soy sauce bottles, pigs)
- **Background:** Warm cream/beige, slightly textured (like rice paper or handmade paper)
- **Typography:** Playful, mixed — large italic serif headings (like cut-and-paste ransom note style from the menu image), clean sans-serif for body
- **Colour palette:**
  - Deep red: `#C0392B` (primary)
  - Dark red: `#922B21`
  - Cream: `#F5E6D3` (background)
  - Ink black: `#1A0A00`
  - Off-white: `#FBF4EC`
- **Borders:** Slightly wobbly/imperfect (achieved with uneven border-radius values)
- **Vibe:** Warm, handmade, homie, heartfelt — NOT corporate, NOT sterile

---

## What to build

### 1. Paper texture background

Download or create a subtle paper texture PNG. Place it at `public/textures/paper.png`.

If you cannot download an asset, generate a CSS-only paper texture using a `::before` pseudo-element with a noise pattern. Add this to `src/app/globals.css`:

```css
.paper-bg {
  position: relative;
  background-color: #F5E6D3;
}

.paper-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: 
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

### 2. `src/components/brand/StampBadge.tsx`

A pill/badge component styled like a rubber stamp. Used for labels like "New", "Popular", "Sold out".

```tsx
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
        // Wobbly border radius for hand-stamped feel
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
```

### 3. `src/components/brand/SectionHeading.tsx`

Large decorative heading used to title each section. Italic serif with a red underline flourish.

```tsx
import { cn } from "@/lib/utils";

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
          "font-display text-4xl md:text-5xl italic text-brand-ink leading-tight"
        )}
      >
        {children}
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
```

### 4. `src/components/brand/PriceTag.tsx`

Styled price display. Large, italic, serif — matching the menu card aesthetic.

```tsx
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
```

### 5. `src/components/brand/MenuCard.tsx`

Card component for a single menu item. Cream background, rough border, hover lift effect.

```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/types";
import { urlFor } from "@/lib/sanity/image";
import { StampBadge } from "./StampBadge";

interface MenuCardProps {
  item: MenuItem;
  className?: string;
}

export function MenuCard({ item, className }: MenuCardProps) {
  return (
    <article
      className={cn(
        "group relative bg-[#FBF4EC] border-2 border-brand-red p-5",
        "[border-radius:4px_12px_6px_10px/10px_6px_12px_4px]",
        "transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {item.image && (
        <div className="relative w-full aspect-square overflow-hidden rounded mb-4">
          <Image
            src={urlFor(item.image).width(400).height(400).url()}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}
      <h3 className="font-display text-2xl italic text-brand-ink mb-1">{item.name}</h3>
      {item.tagline && (
        <p className="font-body text-sm text-brand-ink/60 mb-3">{item.tagline}</p>
      )}
      {item.description && (
        <p className="font-body text-sm text-brand-ink/80">{item.description}</p>
      )}
      {!item.available && (
        <div className="absolute top-3 right-3">
          <StampBadge variant="outline">Sold out</StampBadge>
        </div>
      )}
    </article>
  );
}
```

### 6. `src/components/brand/PricingCard.tsx`

Displays a pricing tier. Featured tiers get a red border + "Best value" stamp.

```tsx
import { cn } from "@/lib/utils";
import { PricingTier } from "@/types";
import { PriceTag } from "./PriceTag";
import { StampBadge } from "./StampBadge";

interface PricingCardProps {
  tier: PricingTier;
  className?: string;
}

export function PricingCard({ tier, className }: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative p-6 bg-[#FBF4EC]",
        "[border-radius:4px_12px_6px_10px/10px_6px_12px_4px]",
        tier.featured
          ? "border-4 border-brand-red shadow-lg"
          : "border-2 border-brand-red/40",
        className
      )}
    >
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <StampBadge>Best value</StampBadge>
        </div>
      )}
      <div className="text-center space-y-2">
        <p className="font-body text-sm text-brand-ink/60 uppercase tracking-widest">
          {tier.quantity} pieces
        </p>
        <PriceTag price={tier.price} />
        {tier.includes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {tier.includes.map((item) => (
              <li key={item} className="font-body text-sm text-brand-ink/70">
                + {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

### 7. `src/components/brand/RedDivider.tsx`

A decorative horizontal divider — red wavy line with a small pig or dumpling icon in the centre.

```tsx
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
      >
        <path d="M12 2C7 2 3 5.5 3 10c0 2.5 1.2 4.7 3 6.2V18a1 1 0 001 1h10a1 1 0 001-1v-1.8c1.8-1.5 3-3.7 3-6.2 0-4.5-4-8-9-8zm0 2c3.9 0 7 2.7 7 6s-3.1 6-7 6-7-2.7-7-6 3.1-6 7-6z" />
      </svg>
      <div className="flex-1 h-px bg-brand-red/30" />
    </div>
  );
}
```

### 8. `src/components/brand/OrderButton.tsx`

Primary CTA button. Links to the Google Forms order URL. Styled as a bold red stamp button.

```tsx
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
        "inline-block font-body font-bold tracking-wider uppercase",
        "bg-brand-red text-brand-cream",
        "border-2 border-brand-red-dark",
        "[border-radius:3px_8px_4px_7px/7px_4px_8px_3px]",
        "transition-all duration-150",
        "hover:bg-brand-red-dark hover:shadow-md active:scale-95",
        size === "lg" && "px-8 py-4 text-base",
        size === "sm" && "px-5 py-2.5 text-sm",
        className
      )}
    >
      {children}
    </Link>
  );
}
```

### 9. `src/components/layout/Header.tsx`

Sticky header: logo/wordmark left, nav links right. On mobile: hamburger using Shadcn `Sheet`.

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OrderButton } from "@/components/brand/OrderButton";

const NAV_LINKS = [
  { label: "Menu", href: "/#menu" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#contact" },
];

interface HeaderProps {
  orderFormUrl?: string;
}

export function Header({ orderFormUrl = "#" }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-sm border-b border-brand-red/20">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="font-display text-xl italic text-brand-red hover:opacity-80 transition-opacity">
          My Wife&apos;s Dumplings
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-body text-sm text-brand-ink/70 hover:text-brand-red transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <OrderButton href={orderFormUrl} size="sm" />
          </li>
        </ul>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5 text-brand-ink" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-brand-cream w-64">
              <nav className="flex flex-col gap-6 mt-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-body text-lg text-brand-ink/80 hover:text-brand-red transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <OrderButton href={orderFormUrl} size="sm" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
```

### 10. `src/components/layout/Footer.tsx`

```tsx
import Link from "next/link";

interface FooterProps {
  instagramUrl?: string;
}

export function Footer({ instagramUrl }: FooterProps) {
  return (
    <footer className="bg-brand-ink text-brand-cream py-10 mt-20">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-xl italic">My Wife&apos;s Dumplings</p>
        <p className="font-body text-sm text-brand-cream/60">
          Handmade with love. Auckland, NZ.
        </p>
        <div className="flex gap-4">
          {instagramUrl && (
            <Link
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-brand-cream/60 hover:text-brand-cream transition-colors"
            >
              Instagram ↗
            </Link>
          )}
        </div>
      </div>
      <p className="text-center mt-6 font-body text-xs text-brand-cream/30">
        © {new Date().getFullYear()} My Wife&apos;s Dumplings. All rights reserved.
      </p>
    </footer>
  );
}
```

### 11. `src/components/brand/index.ts` — barrel export

```ts
export { StampBadge } from "./StampBadge";
export { SectionHeading } from "./SectionHeading";
export { PriceTag } from "./PriceTag";
export { MenuCard } from "./MenuCard";
export { PricingCard } from "./PricingCard";
export { RedDivider } from "./RedDivider";
export { OrderButton } from "./OrderButton";
```

---

## Verify success

Run `npm run build` — TypeScript should compile with no errors. All components are UI-only, no data fetching, so they should build cleanly.

Optionally write a quick Vitest smoke test for `StampBadge` in `src/test/StampBadge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { StampBadge } from "@/components/brand/StampBadge";

test("renders stamp badge text", () => {
  render(<StampBadge>New</StampBadge>);
  expect(screen.getByText("New")).toBeInTheDocument();
});
```

Run: `npx vitest run`

---

## Output for next agent

Agent 4 (Core Pages) receives:
- All brand components in `src/components/brand/`
- `Header` and `Footer` in `src/components/layout/`
- `OrderButton`, `SectionHeading`, `MenuCard`, `PricingCard` ready to use
