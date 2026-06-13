"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OrderButton } from "@/components/brand/OrderButton";

const NAV_LINKS = [
  { label: "Menu", href: "/#menu" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#contact" },
];

interface HeaderProps {
  orderFormUrl?: string;
}

export function Header({ orderFormUrl = "#" }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-sm border-b border-brand-red/20">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-xl italic text-brand-red hover:opacity-80 transition-opacity"
        >
          My Wife&apos;s Dumplings
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-body text-sm text-brand-ink/70 hover:text-brand-red transition-colors duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <OrderButton href={orderFormUrl} size="sm" />
          </li>
        </ul>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open navigation menu" />
              }
            >
              <Menu className="w-5 h-5 text-brand-ink" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-brand-cream w-64">
              <nav className="flex flex-col gap-6 mt-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-body text-lg text-brand-ink/80 hover:text-brand-red transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
                <OrderButton href={orderFormUrl} size="sm" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
