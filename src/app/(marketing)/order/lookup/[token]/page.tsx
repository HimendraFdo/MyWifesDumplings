import type { Metadata } from "next";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { LookupClient } from "./LookupClient";

export const metadata: Metadata = {
  title: "Your Order | My Wife's Dumplings",
  robots: { index: false }, // order links are private
};

export default function LookupPage({ params }: { params: { token: string } }) {
  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-lg">
        <SectionHeading subheading="Here's the latest on your order.">
          Your Order
        </SectionHeading>
        <div className="mt-10">
          <LookupClient token={params.token} />
        </div>
      </div>
    </div>
  );
}
