import type { ReactNode } from "react";
import { SectionHeading } from "@/components/brand/SectionHeading";

/**
 * Shared presentational wrapper for the static policy pages (privacy, terms, refunds,
 * cancellations). Keeps typography and spacing consistent across all legal copy so each
 * page file only holds its own wording. These are sensible NZ small-food-business defaults
 * drafted for the owner to review — not a substitute for legal advice.
 */
export function LegalPage({
  title,
  subheading,
  lastUpdated,
  children,
}: {
  title: string;
  subheading: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-16 sm:py-20">
      <article className="mx-auto max-w-2xl">
        <SectionHeading subheading={subheading}>{title}</SectionHeading>

        <p className="mt-8 text-center font-body text-sm text-brand-ink/50">
          Last updated: {lastUpdated}
        </p>

        <div className="legal-prose mt-12 space-y-8 font-body text-brand-ink/80">
          {children}
        </div>
      </article>
    </div>
  );
}

/** A titled section within a legal page. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-brand-ink">{heading}</h2>
      {children}
    </section>
  );
}
