import type { PricingTier, Extra } from "@/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { PricingCard } from "@/components/brand/PricingCard";
import { OrderButton } from "@/components/brand/OrderButton";
import { RedDivider } from "@/components/brand/RedDivider";
import { SoyBottle, CabbageHead } from "@/components/brand/Decorations";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface PricingSectionProps {
  tiers: PricingTier[];
  extras: Extra[];
  orderFormUrl?: string;
}

const FALLBACK_TIERS: PricingTier[] = [
  {
    _id: "t1",
    quantity: 20,
    price: 16,
    includes: ["2 dumpling soups", "wife's secret sauce"],
    featured: false,
  },
  {
    _id: "t2",
    quantity: 60,
    price: 45,
    includes: ["4 dumpling soups", "wife's secret sauce"],
    featured: true,
  },
];

const FALLBACK_EXTRAS: Extra[] = [
  { _id: "e1", name: "Wife's secret sauce", price: 1 },
  { _id: "e2", name: "Dumpling soup", price: 1 },
];

export function PricingSection({ tiers, extras, orderFormUrl }: PricingSectionProps) {
  const displayTiers = tiers.length > 0 ? tiers : FALLBACK_TIERS;
  const displayExtras = extras.length > 0 ? extras : FALLBACK_EXTRAS;

  return (
    <section id="pricing" className="relative py-16 sm:py-20 px-4 bg-brand-ink/5 overflow-x-clip">
      {/* Decorative poster-style elements */}
      <div className="absolute bottom-8 left-4 pointer-events-none hidden md:block">
        <CabbageHead className="w-16 h-16 opacity-30" />
      </div>
      <div className="absolute top-8 right-4 pointer-events-none hidden md:block">
        <SoyBottle className="w-10 h-20 opacity-25" />
      </div>

      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <SectionHeading subheading="Simple pricing. Big flavour.">
            Pricing
          </SectionHeading>
        </ScrollReveal>

        <RedDivider className="my-8 sm:my-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-6 max-w-2xl mx-auto">
          {displayTiers.map((tier, i) => (
            <ScrollReveal key={tier._id} delay={i * 150}>
              <PricingCard tier={tier} />
            </ScrollReveal>
          ))}
        </div>

        {displayExtras.length > 0 && (
          <ScrollReveal delay={300} className="mt-10 sm:mt-12 text-center">
            <h3 className="font-display text-2xl italic text-brand-ink mb-4">Extras</h3>
            <ul className="space-y-2">
              {displayExtras.map((extra) => (
                <li
                  key={extra._id}
                  className="font-body text-brand-ink/80 flex justify-center gap-6 sm:gap-10"
                >
                  <span>{extra.name}</span>
                  <span className="text-brand-red font-semibold">${extra.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}

        {/* Mini-CTA at end of pricing chapter — per Scroll-Triggered Storytelling pattern */}
        {orderFormUrl && (
          <ScrollReveal delay={400} className="mt-10 sm:mt-12 text-center">
            <p className="font-body text-sm text-brand-ink/50 mb-4 italic">
              Ready to pick your size?
            </p>
            <OrderButton href={orderFormUrl} size="lg">
              Place an Order
            </OrderButton>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
