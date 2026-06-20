import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund Policy | My Wife's Dumplings",
  description:
    "When and how My Wife's Dumplings provides refunds, in line with NZ consumer law.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subheading="We want every order to be right. Here's how we handle refunds."
      lastUpdated={LEGAL.lastUpdated}
    >
      <p>
        Because our dumplings are handmade fresh to order and are a perishable food product,
        we can&apos;t accept returns. But your rights under the New Zealand Consumer
        Guarantees Act 1993 always apply, and we&apos;ll always make it right if something is
        wrong with your order.
      </p>

      <LegalSection heading="If something is wrong with your order">
        <p>
          If your order is faulty, incorrect, or not of acceptable quality, please contact
          us as soon as possible — ideally on the day of pickup or delivery — with your order number and
          a photo if you can. We will offer a repair, replacement, or refund as appropriate.
        </p>
      </LegalSection>

      <LegalSection heading="When we offer a refund">
        <ul className="list-disc space-y-1 pl-5">
          <li>We made a mistake with your order (wrong items or missing items).</li>
          <li>The food was not of acceptable quality when you received it.</li>
          <li>We had to cancel your order and couldn&apos;t fulfil it.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="When we may not offer a refund">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            You changed your mind after the order was confirmed (see our{" "}
            <a className="font-semibold text-brand-red hover:underline" href="/cancellations">
              Cancellation Policy
            </a>
            ).
          </li>
          <li>
            The order wasn&apos;t collected or wasn&apos;t able to be delivered at the agreed
            time, or wasn&apos;t stored or cooked as advised after pickup or delivery.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How refunds are paid">
        <p>
          Approved refunds are made to your original payment method through Stripe. Refunds
          usually appear within 5–10 business days, depending on your bank.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          To request a refund, email{" "}
          <a
            className="font-semibold text-brand-red hover:underline"
            href={`mailto:${LEGAL.contactEmail}`}
          >
            {LEGAL.contactEmail}
          </a>{" "}
          with your order number.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
