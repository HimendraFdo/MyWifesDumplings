import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";
import { CabbageHead, ChiveSprig } from "@/components/brand/Decorations";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface AboutSectionProps {
  aboutText?: PortableTextBlock[];
}

const portableTextComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="font-body text-brand-ink/80 text-base sm:text-lg leading-relaxed">
        {children}
      </p>
    ),
  },
};

export function AboutSection({ aboutText }: AboutSectionProps) {
  return (
    <section id="about" className="relative py-16 sm:py-20 px-4 overflow-x-clip">
      {/* Decorative elements — flanking the section like the poster border */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block">
        <ChiveSprig className="w-10 h-36 opacity-30" />
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block">
        <CabbageHead className="w-14 h-14 opacity-25" />
      </div>

      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <SectionHeading>Our Story</SectionHeading>
        </ScrollReveal>

        <RedDivider className="my-8 sm:my-10" />

        <ScrollReveal delay={150} className="space-y-4 text-center">
          {aboutText && aboutText.length > 0 ? (
            <PortableText value={aboutText} components={portableTextComponents} />
          ) : (
            <>
              <p className="font-body text-brand-ink/80 text-base sm:text-lg leading-relaxed">
                My wife&apos;s dumpling journey started in our kitchen — made for friends,
                family, and anyone lucky enough to be around when the folding began.
              </p>
              <p className="font-body text-brand-ink/80 text-base sm:text-lg leading-relaxed">
                Dumplings made with love, shared like stories. Handmade, homie &amp; heartfelt
                — right here in Auckland, NZ.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* Pull quote — using the ransom note aesthetic for the decorative label */}
        <ScrollReveal delay={300} className="mt-10">
          <div className="relative border-l-4 border-brand-red pl-4 sm:pl-5 text-left">
            {/* Small ransom-style "quote" label */}
            <span
              className="font-ransom text-xs text-brand-red uppercase tracking-widest
                block mb-2 opacity-70"
            >
              — wife&apos;s motto
            </span>
            <blockquote>
              <p className="font-display text-xl sm:text-2xl italic text-brand-ink leading-snug">
                &ldquo;Handmade with love, shared like stories.&rdquo;
              </p>
            </blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
