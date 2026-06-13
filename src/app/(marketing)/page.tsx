import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  StampBadge,
  SectionHeading,
  PriceTag,
  PricingCard,
  RedDivider,
  OrderButton,
} from "@/components/brand";

const MOCK_PRICING: { _id: string; quantity: number; price: number; includes: string[]; featured: boolean }[] = [
  {
    _id: "1",
    quantity: 20,
    price: 16,
    includes: ["2 dumpling soups", "wife's secret sauce"],
    featured: false,
  },
  {
    _id: "2",
    quantity: 60,
    price: 45,
    includes: ["4 dumpling soups", "wife's secret sauce"],
    featured: true,
  },
];

export default function Page() {
  return (
    <>
      <Header orderFormUrl="https://docs.google.com/forms/d/1ceXI_Ul9aQ96Mhs7PbZKitqHoc_dPAhrMY3W" />

      <main className="paper-bg min-h-screen">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-24 text-center">
          <StampBadge className="mb-6">Handmade in Auckland, NZ</StampBadge>
          <h1 className="font-display text-6xl md:text-7xl italic text-brand-ink leading-tight mb-4">
            My Wife&apos;s Dumplings
          </h1>
          <p className="font-body text-lg text-brand-ink/70 mb-8 max-w-md mx-auto">
            Handmade with love. Pork &amp; chives, pork &amp; cabbage — made fresh to order.
          </p>
          <OrderButton href="https://docs.google.com/forms/d/1ceXI_Ul9aQ96Mhs7PbZKitqHoc_dPAhrMY3W" />
        </section>

        <RedDivider className="max-w-5xl mx-auto px-4" />

        {/* Menu */}
        <section id="menu" className="max-w-5xl mx-auto px-4 py-16">
          <SectionHeading subheading="Fresh-made dumplings with premium fillings">
            The Menu
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Pork n Chives", tagline: "pork mince, chives, fried egg, ginger" },
              { name: "Pork n Cabbage", tagline: "pork mince, cabbage, ginger, sesame" },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-[#FBF4EC] border-2 border-brand-red p-6 [border-radius:4px_12px_6px_10px/10px_6px_12px_4px] hover:-translate-y-1 hover:shadow-lg transition-transform duration-200"
              >
                <h3 className="font-display text-3xl italic text-brand-ink mb-1">{item.name}</h3>
                <p className="font-body text-sm text-brand-ink/60">{item.tagline}</p>
              </div>
            ))}
          </div>
        </section>

        <RedDivider className="max-w-5xl mx-auto px-4" />

        {/* Pricing */}
        <section id="pricing" className="max-w-5xl mx-auto px-4 py-16">
          <SectionHeading subheading="Pick your size — more is always better">
            Pricing
          </SectionHeading>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {MOCK_PRICING.map((tier) => (
              <PricingCard key={tier._id} tier={tier} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-body text-sm text-brand-ink/60 mb-2">Extras</p>
            <p className="font-body text-sm text-brand-ink/70">Wife&apos;s secret sauce — $1.00</p>
            <p className="font-body text-sm text-brand-ink/70">Dumpling soup — $1.00</p>
          </div>
        </section>

        <RedDivider className="max-w-5xl mx-auto px-4" />

        {/* Badges showcase */}
        <section className="max-w-5xl mx-auto px-4 py-16 text-center">
          <SectionHeading subheading="A taste of the design system">
            Component Showcase
          </SectionHeading>
          <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
            <StampBadge>New</StampBadge>
            <StampBadge>Popular</StampBadge>
            <StampBadge variant="outline">Sold out</StampBadge>
            <StampBadge variant="outline">Coming soon</StampBadge>
          </div>
          <div className="mt-8 flex gap-6 justify-center items-end">
            <PriceTag price={16} size="sm" />
            <PriceTag price={45} size="lg" />
          </div>
          <div className="mt-8 flex gap-4 justify-center">
            <OrderButton href="#" size="lg">Order Now</OrderButton>
            <OrderButton href="#" size="sm">Quick Order</OrderButton>
          </div>
        </section>
      </main>

      <Footer instagramUrl="https://www.instagram.com/mywifesdumplings" />
    </>
  );
}
