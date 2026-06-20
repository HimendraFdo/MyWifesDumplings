import Link from "next/link";

interface FooterProps {
  instagramUrl?: string;
}

const CONTACT_EMAIL = "mywifesdumplingsofficial@gmail.com";

export function Footer({ instagramUrl }: FooterProps) {
  return (
    <footer className="bg-brand-ink text-brand-cream mt-20">
      <div className="max-w-3xl mx-auto px-4 py-14 flex flex-col items-center text-center gap-6">
        <p className="font-display text-2xl italic">My Wife&apos;s Dumplings</p>

        <p className="font-body text-sm text-brand-cream/60">
          Handmade with love. Auckland, NZ.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-body text-sm">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand-cream/70 hover:text-brand-cream transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
          >
            {CONTACT_EMAIL}
          </a>
          {instagramUrl && (
            <Link
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cream/70 hover:text-brand-cream transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Instagram ↗
            </Link>
          )}
        </div>

        <div className="w-full max-w-xs border-t border-brand-cream/10" />

        <nav
          aria-label="Policies"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-body text-xs"
        >
          <Link
            href="/privacy"
            className="text-brand-cream/60 hover:text-brand-cream transition-colors duration-200"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-brand-cream/60 hover:text-brand-cream transition-colors duration-200"
          >
            Terms
          </Link>
          <Link
            href="/refunds"
            className="text-brand-cream/60 hover:text-brand-cream transition-colors duration-200"
          >
            Refunds
          </Link>
          <Link
            href="/cancellations"
            className="text-brand-cream/60 hover:text-brand-cream transition-colors duration-200"
          >
            Cancellations
          </Link>
        </nav>

        <p className="font-body text-xs text-brand-cream/40">
          © {new Date().getFullYear()} My Wife&apos;s Dumplings. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
