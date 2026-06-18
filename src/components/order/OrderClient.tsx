"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import type { PricingTier, Extra } from "@/types";
import { api, ApiError } from "@/lib/api/client";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { useAuth } from "@/lib/auth/auth-context";
import {
  cartSubtotal,
  emptyCart,
  isCartSubmittable,
  toOrderPayload,
  type CartState,
} from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { PaymentForm } from "./PaymentForm";

type Step = "cart" | "payment" | "confirmed";

export function OrderClient({
  tiers,
  extras,
}: {
  tiers: PricingTier[];
  extras: Extra[];
}) {
  const { session } = useAuth();
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("cart");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => cartSubtotal(cart, extras), [cart, extras]);
  const stripeReady = isStripeConfigured();

  function selectTier(tier: PricingTier) {
    setCart((c) => ({ ...c, tier }));
  }

  function setExtraQty(extra: Extra, qty: number) {
    setCart((c) => {
      const next = { ...c.extras };
      if (qty <= 0) delete next[extra._id];
      else next[extra._id] = qty;
      return { ...c, extras: next };
    });
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isCartSubmittable(cart)) {
      setError("Please choose a dumpling pack to continue.");
      return;
    }
    if (!stripeReady) {
      setError("Payments are not configured yet. Please try again later.");
      return;
    }

    setSubmitting(true);
    try {
      // Price-free payload: { customerEmail, items: [{ menuItemId, quantity }] } (spec §12).
      // The JWT is attached when logged in so the order is stamped to the account;
      // guests post the same payload with no token (spec §4 — identical flow).
      const payload = toOrderPayload(cart, email.trim());
      const res = await api.createOrder(payload, session?.token);
      setOrderId(res.orderId);
      setClientSecret(res.clientSecret);
      setStep("payment");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong creating your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirmed") {
    return (
      <div className="mx-auto max-w-lg rounded-xl border-2 border-brand-ink/10 bg-brand-cream p-8 text-center">
        <h2 className="font-display text-3xl text-brand-ink">Thank you!</h2>
        <p className="mt-3 font-body text-brand-ink/70">
          We&apos;ve received your payment for{" "}
          <span className="font-semibold">order #{orderId}</span>. Your order is being
          confirmed — we&apos;ll email{" "}
          <span className="font-semibold">{email}</span> a receipt and a link to track
          it as soon as payment clears.
        </p>
        <p className="mt-2 font-body text-sm text-brand-ink/50">
          Payment is confirmed by our system once Stripe notifies us — this can take a
          moment.
        </p>
        {session && (
          <Link
            href="/account/orders"
            className="mt-6 inline-block font-body text-sm font-semibold text-brand-red underline-offset-4 hover:underline"
          >
            View your orders →
          </Link>
        )}
      </div>
    );
  }

  if (step === "payment" && clientSecret) {
    return (
      <div className="mx-auto max-w-lg">
        <h2 className="mb-1 font-display text-2xl text-brand-ink">Payment</h2>
        <p className="mb-6 font-body text-sm text-brand-ink/60">
          Order #{orderId} · we re-priced your cart server-side — total{" "}
          <span className="font-semibold">${subtotal.toFixed(2)}</span>.
        </p>
        <Elements
          stripe={getStripe()}
          options={{
            clientSecret,
            appearance: {
              theme: "flat",
              variables: {
                colorPrimary: "#C0392B",
                colorBackground: "#F5E6D3",
                colorText: "#1A0A00",
                borderRadius: "8px",
              },
            },
          }}
        >
          <PaymentForm
            amountLabel={`$${subtotal.toFixed(2)}`}
            onConfirmed={() => setStep("confirmed")}
          />
        </Elements>
      </div>
    );
  }

  // --- Cart step ---
  return (
    <form onSubmit={handleCreateOrder} className="mx-auto max-w-2xl space-y-10">
      {/* Tiers */}
      <section>
        <h2 className="mb-4 font-display text-2xl text-brand-ink">1. Pick your pack</h2>
        {tiers.length === 0 ? (
          <p className="font-body text-brand-ink/60">
            The menu is being updated — please check back shortly.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier) => {
              const selected = cart.tier?._id === tier._id;
              return (
                <button
                  type="button"
                  key={tier._id}
                  onClick={() => selectTier(tier)}
                  aria-pressed={selected}
                  className={
                    "rounded-xl border-2 p-5 text-left transition-all " +
                    (selected
                      ? "border-brand-red bg-brand-red/5 ring-2 ring-brand-red/30"
                      : "border-brand-ink/10 bg-brand-cream hover:border-brand-red/40")
                  }
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-xl text-brand-ink">
                      {tier.quantity} dumplings
                    </span>
                    <span className="font-body font-bold text-brand-red">
                      ${tier.price.toFixed(2)}
                    </span>
                  </div>
                  {tier.includes?.length > 0 && (
                    <ul className="mt-2 space-y-0.5 font-body text-sm text-brand-ink/60">
                      {tier.includes.map((inc) => (
                        <li key={inc}>+ {inc}</li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Extras */}
      {extras.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl text-brand-ink">
            2. Add extras{" "}
            <span className="font-body text-base text-brand-ink/50">(optional)</span>
          </h2>
          <ul className="space-y-3">
            {extras.map((extra) => {
              const qty = cart.extras[extra._id] ?? 0;
              return (
                <li
                  key={extra._id}
                  className="flex items-center justify-between gap-4 rounded-lg border-2 border-brand-ink/10 bg-brand-cream px-4 py-3"
                >
                  <div>
                    <p className="font-body text-brand-ink">{extra.name}</p>
                    <p className="font-body text-sm text-brand-red">
                      ${extra.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove one ${extra.name}`}
                      onClick={() => setExtraQty(extra, qty - 1)}
                      disabled={qty === 0}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center font-body tabular-nums text-brand-ink">
                      {qty}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Add one ${extra.name}`}
                      onClick={() => setExtraQty(extra, qty + 1)}
                    >
                      +
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Email + total */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-brand-ink">3. Your details</h2>
        {!session && (
          <p className="font-body text-sm text-brand-ink/60">
            Ordering as a guest.{" "}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Log in
            </Link>{" "}
            to save this order to your account — checkout is exactly the same either way.
          </p>
        )}
        <div>
          <Label htmlFor="email">Email for your receipt &amp; order link</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="flex items-center justify-between border-t-2 border-brand-ink/10 pt-4">
          <span className="font-display text-xl text-brand-ink">Total</span>
          <span className="font-display text-2xl text-brand-red">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <p className="font-body text-xs text-brand-ink/50">
          Your total is calculated and verified by our server at checkout.
        </p>

        <FieldError>{error}</FieldError>

        <Button
          type="submit"
          disabled={submitting || !isCartSubmittable(cart)}
          className="h-12 w-full bg-brand-red text-base text-brand-cream hover:bg-brand-red-dark"
        >
          {submitting ? "Starting checkout…" : "Continue to payment"}
        </Button>
      </section>
    </form>
  );
}
