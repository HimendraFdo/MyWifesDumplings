import type { Metadata } from "next";
import { getPricingTiers, getExtras } from "@/lib/sanity/queries";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { OrderClient } from "@/components/order/OrderClient";

export const metadata: Metadata = {
  title: "Order | My Wife's Dumplings",
  description: "Pick your dumpling pack, add extras, and pay securely.",
};

export default async function OrderPage() {
  // Menu/pricing is read from Sanity (the source of truth, spec §1). The cart only
  // ever sends the Sanity _id of priced docs (tiers/extras) to the API — never prices.
  const [tiers, extras] = await Promise.all([getPricingTiers(), getExtras()]);

  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading subheading="Handmade to order. Pick your pack and pay securely.">
          Place an Order
        </SectionHeading>
        <div className="mt-12">
          <OrderClient tiers={tiers} extras={extras} />
        </div>
      </div>
    </div>
  );
}
