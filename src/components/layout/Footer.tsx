import Link from "next/link";

interface FooterProps {
  instagramUrl?: string;
}

export function Footer({ instagramUrl }: FooterProps) {
  return (
    <footer className="bg-brand-ink text-brand-cream py-10 mt-20">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-xl italic">My Wife&apos;s Dumplings</p>
        <p className="font-body text-sm text-brand-cream/60">
          Handmade with love. Auckland, NZ.
        </p>
        <div className="flex gap-4">
          {instagramUrl && (
            <Link
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-brand-cream/60 hover:text-brand-cream transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Instagram ↗
            </Link>
          )}
        </div>
      </div>
      <p className="text-center mt-6 font-body text-xs text-brand-cream/30">
        © {new Date().getFullYear()} My Wife&apos;s Dumplings. All rights reserved.
      </p>
    </footer>
  );
}
