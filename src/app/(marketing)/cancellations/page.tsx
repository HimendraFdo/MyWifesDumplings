import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cancellation Policy | My Wife's Dumplings",
  description: "How to change or cancel your My Wife's Dumplings order.",
};

export default function CancellationsPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      subheading="Plans change — here's how to cancel or adjust an order."
      lastUpdated={LEGAL.lastUpdated}
    >
      <p>
        Because everything is handmade fresh to order, the timing of a cancellation matters.
        Please let us know as early as you can.
      </p>

      <LegalSection heading="Cancelling before we start preparing">
        <p>
          If you cancel <strong>before we begin preparing</strong> your order, we&apos;ll
          give you a full refund. As a guide, this means contacting us by the evening before
          your pickup day. The sooner you reach us, the easier it is to stop preparation.
        </p>
      </LegalSection>

      <LegalSection heading="Cancelling after we've started">
        <p>
          Once we&apos;ve started making your order, we may not be able to refund it, because
          fresh ingredients have already been used. We&apos;ll always try to be fair — if you
          have a genuine reason, get in touch and we&apos;ll do our best to help.
        </p>
      </LegalSection>

      <LegalSection heading="Changing your order">
        <p>
          Want to change quantities, flavour, or pickup details? Message us as early as
          possible and we&apos;ll update your order if we can before preparation starts.
        </p>
      </LegalSection>

      <LegalSection heading="If we have to cancel">
        <p>
          Very occasionally we may need to cancel an order (for example, if we&apos;re
          unwell or can&apos;t source ingredients). If that happens, we&apos;ll let you know
          as soon as possible and give you a full refund.
        </p>
      </LegalSection>

      <LegalSection heading="How to cancel">
        <p>
          Email{" "}
          <a
            className="font-semibold text-brand-red hover:underline"
            href={`mailto:${LEGAL.contactEmail}`}
          >
            {LEGAL.contactEmail}
          </a>{" "}
          with your order number and we&apos;ll confirm your cancellation and any refund.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
