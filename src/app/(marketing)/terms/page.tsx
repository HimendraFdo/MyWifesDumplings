import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | My Wife's Dumplings",
  description: "The terms that apply when you order from My Wife's Dumplings.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subheading="The basics that apply when you order from us."
      lastUpdated={LEGAL.lastUpdated}
    >
      <p>
        These terms apply when you place an order with {LEGAL.businessName}. By ordering,
        you agree to them. {LEGAL.pickupSummary}
      </p>

      <LegalSection heading="Ordering">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Orders are placed through our website. Because everything is handmade to order,
            we ask for {LEGAL.leadTime} notice.
          </li>
          <li>
            An order is only confirmed once your payment has been completed and you receive
            a confirmation email.
          </li>
          <li>
            We&apos;ll contact you to arrange a pickup time and place after your order is
            confirmed.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Prices and payment">
        <ul className="list-disc space-y-1 pl-5">
          <li>All prices are in New Zealand dollars (NZD).</li>
          <li>
            Your total is calculated and verified by our system at checkout. Payment is
            handled securely by Stripe — we never see or store your card details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Pickup">
        <ul className="list-disc space-y-1 pl-5">
          <li>Orders are for pickup only, at a time and place we arrange with you.</li>
          <li>
            Please collect your order at the agreed time so it&apos;s as fresh as possible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Food, allergens, and storage">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Our dumplings are handmade in a kitchen that handles common allergens including
            gluten, soy, sesame, egg, and shellfish. If you have an allergy, please tell us
            before ordering — we can&apos;t guarantee an allergen-free product.
          </li>
          <li>
            Please refrigerate or freeze your dumplings promptly and follow any cooking and
            storage guidance we give you.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your consumer rights">
        <p>
          Nothing in these terms limits your rights under the New Zealand Consumer
          Guarantees Act 1993 and Fair Trading Act 1986. See our{" "}
          <Link
            href="/refunds"
            className="font-semibold text-brand-red hover:underline"
          >
            Refund Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/cancellations"
            className="font-semibold text-brand-red hover:underline"
          >
            Cancellation Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions? Email{" "}
          <a
            className="font-semibold text-brand-red hover:underline"
            href={`mailto:${LEGAL.contactEmail}`}
          >
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
