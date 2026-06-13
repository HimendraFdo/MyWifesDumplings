# Agent 6 — Animations & Visual Polish (Framer Motion)

## Your role
You are the animation and polish agent. The site is functionally complete. Your job is to layer on motion, micro-interactions, and visual details that make this feel handcrafted and alive — matching the warm, playful brand.

**Principle:** Motion should feel organic and slightly imperfect, like the hand-drawn illustrations. Not slick and corporate. Think: gentle fades, stamp-like pops, wobbly entrances.

---

## Why Framer Motion adds CV value

Framer Motion is the dominant animation library in the React/Next.js ecosystem in NZ. It is used at most NZ agencies (Springload, Ackama, Devotion) and startups. Demonstrating server/client boundary awareness with Framer Motion in Next.js App Router is a real skill (it requires `"use client"` wrappers for motion components).

---

## Prerequisites

- Framer Motion already installed (`npm list framer-motion` to confirm)
- All sections from Agent 4 and 5 are in place and working

---

## Pattern: Client wrappers for animations

In Next.js App Router, page sections are Server Components by default. Framer Motion requires `"use client"`. The pattern to use throughout:

1. Keep the data-fetching server component as-is
2. Extract the animated parts into a `"use client"` wrapper component
3. Pass the data down as props

---

## Step 1 — Animated section entry (`FadeUp`)

Create `src/components/brand/FadeUp.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### Usage — wrap section headings and card grids:

In `MenuSection.tsx`, `PricingSection.tsx`, `AboutSection.tsx`, `GallerySection.tsx`, and `ContactSection.tsx`:

```tsx
// Add "use client" directive OR keep server component and just wrap
// the animated children inside FadeUp (FadeUp is "use client", so
// passing children from a server component is fine)

import { FadeUp } from "@/components/brand/FadeUp";

// Wrap SectionHeading:
<FadeUp>
  <SectionHeading ...>...</SectionHeading>
</FadeUp>

// Wrap each MenuCard with a staggered delay:
{items.map((item, i) => (
  <FadeUp key={item._id} delay={i * 0.1}>
    <MenuCard item={item} />
  </FadeUp>
))}
```

---

## Step 2 — Hero stamp entrance animation

The hero heading should "stamp" onto the screen like a rubber stamp hitting paper.

Update `HeroSection.tsx` — add `"use client"` and import `motion`:

```tsx
"use client";

import { motion } from "framer-motion";
// ... other imports ...

export function HeroSection({ heading, subheading, heroImage, orderFormUrl }: HeroSectionProps) {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4">
      {/* ... background image + overlay unchanged ... */}

      <div className="relative z-20 text-center max-w-2xl space-y-6">
        {/* Logo stamp animation */}
        <motion.div
          initial={{ opacity: 0, scale: 1.4, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="w-24 h-24 mx-auto rounded-full border-4 border-brand-red bg-brand-cream
            flex items-center justify-center text-brand-red text-4xl
            [border-radius:50%_48%_52%_50%/49%_51%_50%_52%]"
        >
          🥟
        </motion.div>

        {/* Heading stamp */}
        <motion.h1
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="font-display text-5xl md:text-7xl italic text-brand-ink leading-tight"
        >
          {heading}
        </motion.h1>

        {/* Subheading fade */}
        {subheading && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-lg text-brand-ink/70"
          >
            {subheading}
          </motion.p>
        )}

        {/* CTA fade */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {/* ... buttons unchanged ... */}
        </motion.div>
      </div>
    </section>
  );
}
```

---

## Step 3 — MenuCard hover wiggle

Update `MenuCard.tsx` — add `"use client"` and a `motion.article` with a subtle rotation on hover:

```tsx
"use client";

import { motion } from "framer-motion";

// Replace <article ...> with:
<motion.article
  whileHover={{ rotate: [-0.5, 0.5, 0], transition: { duration: 0.3 } }}
  // ... keep all existing className props ...
>
  {/* ... card content unchanged ... */}
</motion.article>
```

---

## Step 4 — Pricing card pop on hover

Update `PricingCard.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

// Replace outer <div> with:
<motion.div
  whileHover={{ y: -6, boxShadow: "0 12px 24px rgba(192, 57, 43, 0.15)" }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className={cn(/* ... existing classes ... */)}
>
```

---

## Step 5 — Gallery image reveal

Update `GallerySection.tsx` to use a staggered reveal on each image as it enters the viewport.

Change the image wrapper `<div>` to a `motion.div`:

```tsx
"use client";

import { motion } from "framer-motion";

// Replace each image wrapper div with:
<motion.div
  key={img._id}
  initial={{ opacity: 0, scale: 0.96 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true, margin: "-40px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  className="break-inside-avoid overflow-hidden rounded ..."
>
```

---

## Step 6 — Scroll progress indicator

Add a thin red progress bar at the top of the page that fills as the user scrolls.

Create `src/components/brand/ScrollProgress.tsx`:

```tsx
"use client";

import { useScroll, useSpring, motion } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-0.5 bg-brand-red origin-left z-[100]"
    />
  );
}
```

Add to `src/app/(marketing)/layout.tsx`:

```tsx
import { ScrollProgress } from "@/components/brand/ScrollProgress";

// Inside the layout, before <Header>:
<ScrollProgress />
<Header ... />
```

---

## Step 7 — Smooth scroll behaviour

Add to `src/app/globals.css`:

```css
html {
  scroll-behavior: smooth;
}
```

---

## Step 8 — Page transition wrapper (optional but impressive)

Create `src/components/brand/PageTransition.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Wrap `{children}` in `src/app/(marketing)/layout.tsx`:

```tsx
<main className="paper-bg min-h-screen">
  <PageTransition>{children}</PageTransition>
</main>
```

---

## Step 9 — Nav link hover underline

Update `Header.tsx` nav links to use a Framer Motion animated underline:

```tsx
"use client";

// Replace the Link component in the nav with:
<Link href={link.href} className="relative group font-body text-sm text-brand-ink/70 hover:text-brand-red transition-colors">
  {link.label}
  <motion.span
    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-brand-red origin-left"
    initial={{ scaleX: 0 }}
    whileHover={{ scaleX: 1 }}
    transition={{ duration: 0.2 }}
  />
</Link>
```

---

## Step 10 — Export all new components

Add to `src/components/brand/index.ts`:

```ts
export { FadeUp } from "./FadeUp";
export { ScrollProgress } from "./ScrollProgress";
export { PageTransition } from "./PageTransition";
```

---

## Visual checklist

Before finishing, verify each animation works in the browser:

- [ ] Hero logo stamps in with a pop
- [ ] Hero heading scales in after the logo
- [ ] Menu cards wiggle on hover
- [ ] Pricing cards lift on hover
- [ ] Section headings and cards fade up as you scroll
- [ ] Gallery images reveal one-by-one as they enter viewport
- [ ] Red scroll progress bar moves at the top
- [ ] Nav links show red underline on hover
- [ ] Smooth scroll when clicking nav anchors

---

## Performance note

Check `npm run build` output. If Framer Motion significantly increases bundle size, add it to the `optimizePackageImports` config in `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};
module.exports = nextConfig;
```

---

## Output for next agent

Agent 7 (Deployment & Analytics) receives:
- A visually polished, animated site
- Clean `npm run build` output
- Ready for Vercel deployment
