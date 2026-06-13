# Agent 4 — Core Pages

## Your role
You are the pages agent. Your job is to build all the main content sections of the site as a single scrollable home page, plus wire up the shared layout (Header/Footer). You will fetch real data from Sanity and render it using the brand components built by Agent 3.

---

## Site structure

All content lives on a single scrollable `app/(marketing)/page.tsx` (one-page layout). Sections are anchor-linked from the nav:

1. **Hero** (`#hero`) — Full-screen opener
2. **Menu** (`#menu`) — Menu items grid
3. **Pricing** (`#pricing`) — Pricing tiers + extras
4. **About** (`#about`) — Story / brand statement
5. **Gallery** (`#gallery`) — Photo grid
6. **Contact / CTA** (`#contact`) — Final CTA + Instagram link

---

## Root layout wiring

Update `src/app/(marketing)/layout.tsx` (create this file — it wraps the route group):

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/sanity/queries";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <>
      <Header orderFormUrl={settings?.orderFormUrl} />
      <main className="paper-bg min-h-screen">{children}</main>
      <Footer instagramUrl={settings?.instagramUrl} />
    </>
  );
}
```

---

## Home page — `src/app/(marketing)/page.tsx`

This is a **React Server Component** (no `"use client"` directive). It fetches all data at the top, then passes it to section components.

```tsx
import { getMenuItems, getPricingTiers, getExtras, getGalleryImages, getSiteSettings } from "@/lib/sanity/queries";
import { HeroSection } from "@/components/sections/HeroSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { ContactSection } from "@/components/sections/ContactSection";

export default async function HomePage() {
  const [menuItems, pricingTiers, extras, galleryImages, settings] = await Promise.all([
    getMenuItems(),
    getPricingTiers(),
    getExtras(),
    getGalleryImages(),
    getSiteSettings(),
  ]);

  return (
    <>
      <HeroSection
        heading={settings?.heroHeading ?? "My Wife's Dumplings"}
        subheading={settings?.heroSubheading}
        heroImage={settings?.heroImage}
        orderFormUrl={settings?.orderFormUrl}
      />
      <MenuSection items={menuItems} />
      <PricingSection tiers={pricingTiers} extras={extras} orderFormUrl={settings?.orderFormUrl} />
      <AboutSection aboutText={settings?.aboutText} />
      <GallerySection images={galleryImages} />
      <ContactSection orderFormUrl={settings?.orderFormUrl} instagramUrl={settings?.instagramUrl} />
    </>
  );
}
```

---

## Section components

Create each file in `src/components/sections/`.

### `HeroSection.tsx`

```tsx
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { urlFor } from "@/lib/sanity/image";
import { OrderButton } from "@/components/brand/OrderButton";

interface HeroSectionProps {
  heading: string;
  subheading?: string;
  heroImage?: SanityImageSource;
  orderFormUrl?: string;
}

export function HeroSection({ heading, subheading, heroImage, orderFormUrl }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4"
    >
      {/* Background tint overlay */}
      <div className="absolute inset-0 bg-brand-cream/80 z-10" />

      {/* Hero background image */}
      {heroImage && (
        <Image
          src={urlFor(heroImage).width(1400).height(900).url()}
          alt="My Wife's Dumplings"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {/* Decorative red border frame */}
      <div className="absolute inset-6 border-2 border-brand-red/30 z-10 pointer-events-none
        [border-radius:8px_20px_10px_18px/18px_10px_20px_8px]" />

      {/* Content */}
      <div className="relative z-20 text-center max-w-2xl space-y-6">
        {/* Pig logo placeholder — replace with actual SVG logo */}
        <div className="w-24 h-24 mx-auto rounded-full border-4 border-brand-red bg-brand-cream
          flex items-center justify-center text-brand-red text-4xl
          [border-radius:50%_48%_52%_50%/49%_51%_50%_52%]">
          🥟
        </div>

        <h1 className="font-display text-5xl md:text-7xl italic text-brand-ink leading-tight">
          {heading}
        </h1>

        {subheading && (
          <p className="font-body text-lg text-brand-ink/70">{subheading}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {orderFormUrl && (
            <OrderButton href={orderFormUrl} size="lg">
              Order Now
            </OrderButton>
          )}
          <a
            href="#menu"
            className="font-body text-sm text-brand-red border-b border-brand-red pb-0.5 hover:opacity-70 transition-opacity"
          >
            See the menu ↓
          </a>
        </div>
      </div>
    </section>
  );
}
```

### `MenuSection.tsx`

```tsx
import { MenuItem } from "@/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MenuCard } from "@/components/brand/MenuCard";
import { RedDivider } from "@/components/brand/RedDivider";

interface MenuSectionProps {
  items: MenuItem[];
}

export function MenuSection({ items }: MenuSectionProps) {
  return (
    <section id="menu" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading subheading="Every dumpling is made fresh, by hand, with love.">
          The Menu
        </SectionHeading>

        <RedDivider className="my-10" />

        {items.length === 0 ? (
          <p className="text-center font-body text-brand-ink/50">Menu coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
            {items.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

### `PricingSection.tsx`

```tsx
import { PricingTier, Extra } from "@/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { PricingCard } from "@/components/brand/PricingCard";
import { OrderButton } from "@/components/brand/OrderButton";
import { RedDivider } from "@/components/brand/RedDivider";

interface PricingSectionProps {
  tiers: PricingTier[];
  extras: Extra[];
  orderFormUrl?: string;
}

export function PricingSection({ tiers, extras, orderFormUrl }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 px-4 bg-brand-ink/5">
      <div className="max-w-5xl mx-auto">
        <SectionHeading subheading="Simple pricing. Big flavour.">
          Pricing
        </SectionHeading>

        <RedDivider className="my-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 max-w-2xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard key={tier._id} tier={tier} />
          ))}
        </div>

        {extras.length > 0 && (
          <div className="mt-12 text-center">
            <h3 className="font-display text-2xl italic text-brand-ink mb-4">Extras</h3>
            <ul className="space-y-2">
              {extras.map((extra) => (
                <li key={extra._id} className="font-body text-brand-ink/80 flex justify-center gap-8">
                  <span>{extra.name}</span>
                  <span className="text-brand-red font-semibold">${extra.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {orderFormUrl && (
          <div className="mt-12 text-center">
            <OrderButton href={orderFormUrl} size="lg" />
          </div>
        )}
      </div>
    </section>
  );
}
```

### `AboutSection.tsx`

Uses `@portabletext/react` to render the Sanity rich text about content.

```tsx
import { PortableText } from "@portabletext/react";
import { PortableTextBlock } from "@portabletext/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";

interface AboutSectionProps {
  aboutText?: PortableTextBlock[];
}

const portableTextComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="font-body text-brand-ink/80 text-lg leading-relaxed">{children}</p>
    ),
  },
};

export function AboutSection({ aboutText }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <SectionHeading subheading="">
          Our Story
        </SectionHeading>

        <RedDivider className="my-10" />

        <div className="space-y-4 text-center">
          {aboutText ? (
            <PortableText value={aboutText} components={portableTextComponents} />
          ) : (
            <>
              <p className="font-body text-brand-ink/80 text-lg leading-relaxed">
                Every dumpling is a little story — folded by hand, filled with care, and shared
                like a hug on a cold Auckland night.
              </p>
              <p className="font-body text-brand-ink/80 text-lg leading-relaxed">
                My wife started making dumplings for friends and family. Word spread fast. Now
                she makes them for you.
              </p>
            </>
          )}
        </div>

        {/* Decorative quote */}
        <blockquote className="mt-10 border-l-4 border-brand-red pl-5 text-left">
          <p className="font-display text-2xl italic text-brand-ink">
            &ldquo;Handmade with love, shared like stories.&rdquo;
          </p>
        </blockquote>
      </div>
    </section>
  );
}
```

### `GallerySection.tsx`

Masonry-style image grid using CSS columns.

```tsx
import Image from "next/image";
import { GalleryImage } from "@/types";
import { urlFor } from "@/lib/sanity/image";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";

interface GallerySectionProps {
  images: GalleryImage[];
}

export function GallerySection({ images }: GallerySectionProps) {
  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-20 px-4 bg-brand-ink/5">
      <div className="max-w-5xl mx-auto">
        <SectionHeading subheading="Fresh from the kitchen.">
          Gallery
        </SectionHeading>

        <RedDivider className="my-10" />

        {/* CSS columns masonry */}
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img) => (
            <div
              key={img._id}
              className="break-inside-avoid overflow-hidden rounded
                [border-radius:4px_12px_6px_10px/10px_6px_12px_4px]
                border-2 border-brand-red/20"
            >
              <Image
                src={urlFor(img.image).width(600).url()}
                alt={img.alt}
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### `ContactSection.tsx`

Final CTA section. Links to order form and Instagram.

```tsx
import { OrderButton } from "@/components/brand/OrderButton";
import { SectionHeading } from "@/components/brand/SectionHeading";

interface ContactSectionProps {
  orderFormUrl?: string;
  instagramUrl?: string;
}

export function ContactSection({ orderFormUrl, instagramUrl }: ContactSectionProps) {
  return (
    <section id="contact" className="py-24 px-4 bg-brand-red">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <SectionHeading className="[&_h2]:text-brand-cream [&_div]:bg-brand-cream">
          Ready to order?
        </SectionHeading>

        <p className="font-body text-brand-cream/80 text-lg">
          Fill in our order form and we&apos;ll get back to you shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {orderFormUrl && (
            <a
              href={orderFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body font-bold tracking-wider uppercase
                px-8 py-4 text-base bg-brand-cream text-brand-red
                border-2 border-brand-cream/80
                [border-radius:3px_8px_4px_7px/7px_4px_8px_3px]
                transition-all duration-150 hover:bg-brand-cream/90 hover:shadow-md active:scale-95"
            >
              Order via Form
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body font-bold tracking-wider uppercase
                px-8 py-4 text-base text-brand-cream
                border-2 border-brand-cream/50
                [border-radius:3px_8px_4px_7px/7px_4px_8px_3px]
                transition-all duration-150 hover:border-brand-cream hover:shadow-md"
            >
              DM on Instagram
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
```

---

## Verify success

```bash
npm run dev
```

Visit `localhost:3000`. You should see:
- Sticky header with nav and "Order Now" button
- Hero section with heading
- Menu section (real data from Sanity if seeded, otherwise placeholder text)
- Pricing section with tier cards
- About section
- Gallery (if images uploaded in Sanity)
- Red contact CTA footer section
- Footer

```bash
npm run build
```

Should produce no TypeScript errors. Check that all `Image` components have correct `sizes` props and no console warnings.

---

## Output for next agent

Agent 5 (Order Form & Email) receives:
- `ContactSection` in place — it currently just links to Google Forms
- The plan: Agent 5 will add a **real contact/enquiry form** alongside the Google Forms link using React Hook Form + Zod + Resend
