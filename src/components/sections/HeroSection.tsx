import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/lib/sanity/image";
import { OrderButton } from "@/components/brand/OrderButton";
import { StampBadge } from "@/components/brand/StampBadge";
import { ChiveSprig } from "@/components/brand/Decorations";

interface HeroSectionProps {
  heading: string;
  subheading?: string;
  heroImage?: SanityImageSource;
  orderFormUrl?: string;
}

export function HeroSection({
  heading,
  subheading,
  heroImage,
  orderFormUrl,
}: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[90svh] flex items-center justify-center overflow-x-clip px-4 py-16"
    >
      {/* Background image */}
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

      {/* Cream tint overlay */}
      <div className="absolute inset-0 bg-brand-cream/88 z-10" />

      {/* Decorative chive sprigs — matching the poster border */}
      <div className="absolute left-0 bottom-0 z-10 pointer-events-none hidden sm:block">
        <ChiveSprig className="w-16 h-48 opacity-70" />
      </div>
      <div className="absolute left-6 bottom-12 z-10 pointer-events-none hidden md:block">
        <ChiveSprig className="w-10 h-32 opacity-40" />
      </div>
      <div className="absolute right-0 bottom-0 z-10 pointer-events-none hidden sm:block">
        <ChiveSprig className="w-16 h-48 opacity-70 scale-x-[-1]" />
      </div>
      <div className="absolute right-6 bottom-12 z-10 pointer-events-none hidden md:block">
        <ChiveSprig className="w-10 h-32 opacity-40 scale-x-[-1]" />
      </div>

      {/* Wobbly decorative border frame */}
      <div
        className="absolute inset-4 sm:inset-6 border-2 border-brand-red/25 z-10 pointer-events-none"
        style={{ borderRadius: "8px 20px 10px 18px / 18px 10px 20px 8px" }}
      />
      <div
        className="absolute inset-3 sm:inset-5 border border-brand-red/10 z-10 pointer-events-none"
        style={{ borderRadius: "10px 22px 12px 20px / 20px 12px 22px 10px" }}
      />

      {/* Content */}
      <div className="relative z-20 text-center max-w-xl w-full space-y-5 sm:space-y-6">
        {/* Stamp badge — uses animate-stamp keyframe from tailwind config */}
        <div className="flex justify-center animate-stamp">
          <StampBadge>Handmade in Auckland, NZ</StampBadge>
        </div>

        {/* Brand logo — full pig, white background blended into the cream page via multiply */}
        <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative h-[100px] w-[100px] overflow-hidden rounded-full border-2 border-brand-red bg-brand-cream shadow-md hover:rotate-3 transition-transform duration-300 sm:h-28 sm:w-28">
            <Image
              src="/images/Logo.png"
              alt="My Wife's Dumplings logo"
              fill
              priority
              quality={95}
              sizes="240px"
              className="object-contain scale-[2] -translate-y-2 mix-blend-multiply"
            />
          </div>
        </div>

        <h1
          className="font-display text-4xl sm:text-5xl md:text-7xl italic text-brand-ink leading-tight animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          {heading}
        </h1>

        <p
          className="font-body text-base sm:text-lg text-brand-ink/70 max-w-sm mx-auto px-2 animate-fade-up"
          style={{ animationDelay: "0.35s" }}
        >
          {subheading ?? "Handmade with love. Pork & chives, pork & cabbage — made fresh to order."}
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          {orderFormUrl && (
            <OrderButton href={orderFormUrl} size="lg">
              Order Now
            </OrderButton>
          )}
          <a
            href="#menu"
            className="font-body text-sm text-brand-red border-b border-brand-red pb-0.5
              hover:opacity-70 transition-opacity duration-200 min-h-[44px] flex items-center"
          >
            See the menu ↓
          </a>
        </div>
      </div>
    </section>
  );
}
