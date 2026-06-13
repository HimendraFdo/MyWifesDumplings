import { SectionHeading } from "@/components/brand/SectionHeading";
import { PigDeco } from "@/components/brand/Decorations";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface ContactSectionProps {
  orderFormUrl?: string;
  instagramUrl?: string;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ContactSection({ orderFormUrl, instagramUrl }: ContactSectionProps) {
  return (
    <section id="contact" className="relative py-20 sm:py-24 px-4 bg-brand-red overflow-x-clip">
      {/* Flying pig decorations — matches the bottom of the poster */}
      <div className="absolute bottom-6 left-4 pointer-events-none hidden sm:block">
        <PigDeco className="w-16 h-10 opacity-20" />
      </div>
      <div className="absolute bottom-6 right-4 pointer-events-none hidden sm:block">
        <PigDeco flipped className="w-16 h-10 opacity-20" />
      </div>
      <div className="absolute top-6 left-8 pointer-events-none hidden md:block">
        <PigDeco className="w-12 h-8 opacity-15 -rotate-12" />
      </div>
      <div className="absolute top-6 right-8 pointer-events-none hidden md:block">
        <PigDeco flipped className="w-12 h-8 opacity-15 rotate-12" />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
        <ScrollReveal>
          {/* Override heading colours to work on red background */}
          <div className="[&_h2]:text-brand-cream [&_.brushstroke-bar]:bg-brand-cream/60">
            <SectionHeading>Ready to order?</SectionHeading>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="font-body text-brand-cream/80 text-base sm:text-lg">
            Fill in our order form and we&apos;ll get back to you shortly.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            {orderFormUrl && (
              <a
                href={orderFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center
                  font-body font-bold tracking-wider uppercase
                  px-8 py-4 text-sm sm:text-base bg-brand-cream text-brand-red
                  border-2 border-brand-cream/80 min-h-[52px]
                  transition-all duration-150 hover:bg-brand-cream/90 hover:shadow-lg
                  active:scale-95 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-red"
                style={{ borderRadius: "3px 8px 4px 7px / 7px 4px 8px 3px" }}
              >
                Order via Form
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                  font-body font-bold tracking-wider uppercase
                  px-8 py-4 text-sm sm:text-base text-brand-cream
                  border-2 border-brand-cream/50 min-h-[52px]
                  transition-all duration-150 hover:border-brand-cream hover:bg-brand-cream/10
                  cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-red"
                style={{ borderRadius: "3px 8px 4px 7px / 7px 4px 8px 3px" }}
              >
                <InstagramIcon className="w-4 h-4 flex-shrink-0" />
                DM on Instagram
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Ransom-font sign-off */}
        <ScrollReveal delay={350}>
          <p className="font-ransom text-brand-cream/40 text-sm pt-4">
            Handmade. Homie. Heartfelt.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
