import { OrderButton } from "@/components/brand/OrderButton";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";
import { DynamicScatter } from "@/components/brand/DynamicScatter";
import { LEGAL } from "@/lib/legal";
import { ContactForm } from "./ContactForm";

interface ContactSectionProps {
  orderFormUrl?: string;
  instagramUrl?: string;
}

export function ContactSection({ orderFormUrl, instagramUrl }: ContactSectionProps) {
  return (
    <section id="contact" className="relative py-24 px-4 overflow-x-clip">
      {/* Dynamic scatter — a flying pig and friends around the contact form */}
      <DynamicScatter variant="contact" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <SectionHeading subheading="Two ways to reach us — pick your favourite.">
          Get in Touch
        </SectionHeading>

        <RedDivider className="my-10" />

        {/* Direct contact details */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3 text-center font-body text-sm">
          <div>
            <p className="font-semibold text-brand-ink">Call or text</p>
            <a
              href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}
              className="text-brand-red underline-offset-4 hover:underline"
            >
              {LEGAL.phone}
            </a>
          </div>
          <div>
            <p className="font-semibold text-brand-ink">Email</p>
            <a
              href={`mailto:${LEGAL.contactEmail}`}
              className="break-words text-brand-red underline-offset-4 hover:underline"
            >
              {LEGAL.contactEmail}
            </a>
          </div>
          <div>
            <p className="font-semibold text-brand-ink">Pickup &amp; kitchen</p>
            <p className="text-brand-ink/70">{LEGAL.pickupAddress}</p>
          </div>
        </div>

        {/* Quick order CTA */}
        <div className="text-center mb-12 space-y-3">
          <p className="font-body text-brand-ink/70">
            Prefer a quick order? Use our Google Form:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {orderFormUrl && <OrderButton href={orderFormUrl} size="lg" />}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-body font-bold tracking-wider uppercase
                  px-8 py-4 text-base text-brand-red
                  border-2 border-brand-red
                  [border-radius:3px_8px_4px_7px/7px_4px_8px_3px]
                  transition-all duration-150 hover:bg-brand-red/10"
              >
                DM on Instagram
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-red/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-brand-cream px-4 font-body text-sm text-brand-ink/40">
              or send us a message
            </span>
          </div>
        </div>

        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
