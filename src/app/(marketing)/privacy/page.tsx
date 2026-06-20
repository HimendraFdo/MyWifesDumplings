import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | My Wife's Dumplings",
  description:
    "How My Wife's Dumplings collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subheading="What we collect, why, and how we look after it."
      lastUpdated={LEGAL.lastUpdated}
    >
      <p>
        {LEGAL.businessName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy.
        This policy explains what personal information we collect when you order from us or
        contact us, and how we handle it in line with the New Zealand Privacy Act 2020.
      </p>

      <LegalSection heading="Information we collect">
        <p>We only collect what we need to take and fulfil your order:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your name and contact details (email, phone number, and Instagram handle if you
            message us).
          </li>
          <li>
            For delivery orders, your delivery address and post code, used only to deliver
            your order.
          </li>
          <li>Your order details and any pickup or delivery arrangements we agree with you.</li>
          <li>
            Communications you send us through our contact form, email, or social media.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect or store your card details. Payments are
          processed securely by Stripe; your card number goes directly to Stripe and never
          reaches our systems.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To prepare your order and arrange pickup or delivery.</li>
          <li>To send you an order confirmation and updates about your order.</li>
          <li>To reply to your enquiries.</li>
          <li>To keep basic records of orders for our own accounting.</li>
        </ul>
        <p>We do not sell or rent your personal information to anyone.</p>
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          We share information only with the service providers that help us run the
          business, and only to the extent they need it:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Stripe</strong> — to process your payment securely.
          </li>
          <li>
            <strong>Resend</strong> — to send your order confirmation email.
          </li>
        </ul>
        <p>
          These providers have their own privacy policies and may store data outside New
          Zealand. We may also disclose information where required by law.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          We keep order and contact records only for as long as we need them for the order
          itself and for reasonable business and tax purposes, then we delete them.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask to see the personal information we hold about you, ask us to correct
          it, or ask us to delete it. Email us at{" "}
          <a
            className="font-semibold text-brand-red hover:underline"
            href={`mailto:${LEGAL.contactEmail}`}
          >
            {LEGAL.contactEmail}
          </a>{" "}
          and we&apos;ll help.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy? Email{" "}
          <a
            className="font-semibold text-brand-red hover:underline"
            href={`mailto:${LEGAL.contactEmail}`}
          >
            {LEGAL.contactEmail}
          </a>
          . {LEGAL.businessName} is based in {LEGAL.location}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
