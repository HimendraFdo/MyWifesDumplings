import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Lazily load Stripe.js once with the PUBLISHABLE key from env (spec §5).
 *
 * The publishable key is browser-safe by design. The SECRET key never lives here —
 * card data is collected by Stripe.js and confirmed against the client secret;
 * it goes browser → Stripe directly and never touches our servers (spec §5/§12).
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    // Return a resolved null (rather than throwing) so the page can render a clear
    // "payments not configured" state instead of crashing during build/SSR.
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
