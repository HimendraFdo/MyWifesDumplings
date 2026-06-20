"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import type { PricingTier, Extra, MenuItem } from "@/types";
import type { DeliveryZone, FulfilmentMethod } from "@/lib/api/types";
import { DELIVERY_ZONE_LABEL } from "@/lib/api/types";
import { api, ApiError } from "@/lib/api/client";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { useAuth } from "@/lib/auth/auth-context";
import {
  cartSubtotal,
  estimateDeliveryFee,
  cartTotalEstimate,
  emptyCart,
  isCartSubmittable,
  toOrderPayload,
  type CartState,
  type Fulfilment,
} from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { LEGAL } from "@/lib/legal";
import { PaymentForm } from "./PaymentForm";

type Step = "cart" | "payment" | "confirmed";

const ZONES: DeliveryZone[] = ["EastSouth", "AucklandCentral", "WestNorth"];

const TIME_WINDOWS = [
  "Morning (11am–1pm)",
  "Afternoon (2pm–4pm)",
  "Evening (6pm–8pm)",
];

/** Shared styling for native <select>/<textarea> so they match the brand <Input>. */
const fieldClasses =
  "w-full rounded-md border-2 border-brand-ink/15 bg-brand-cream px-3 py-2 font-body text-brand-ink placeholder:text-brand-ink/40 focus-visible:border-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30";

export function OrderClient({
  tiers,
  extras,
  menuItems,
}: {
  tiers: PricingTier[];
  extras: Extra[];
  menuItems: MenuItem[];
}) {
  const { session } = useAuth();
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("cart");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  // Authoritative amounts returned by the server (the client figure is only an estimate).
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => cartSubtotal(cart, extras), [cart, extras]);
  const deliveryEstimate = useMemo(() => estimateDeliveryFee(cart), [cart]);
  const totalEstimate = useMemo(() => cartTotalEstimate(cart, extras), [cart, extras]);
  const stripeReady = isStripeConfigured();

  const f = cart.fulfilment;
  const isDelivery = f.method === "Delivery";

  function selectTier(tier: PricingTier) {
    setCart((c) => ({ ...c, tier }));
  }

  function selectFlavour(name: string) {
    setCart((c) => ({ ...c, flavour: name }));
  }

  function setExtraQty(extra: Extra, qty: number) {
    setCart((c) => {
      const next = { ...c.extras };
      if (qty <= 0) delete next[extra._id];
      else next[extra._id] = qty;
      return { ...c, extras: next };
    });
  }

  function updateFulfilment(patch: Partial<Fulfilment>) {
    setCart((c) => ({ ...c, fulfilment: { ...c.fulfilment, ...patch } }));
  }

  function setMethod(method: FulfilmentMethod) {
    updateFulfilment({ method });
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cart.tier) {
      setError("Please choose a dumpling pack to continue.");
      return;
    }
    if (!cart.flavour) {
      setError("Please choose your dumpling flavour to continue.");
      return;
    }
    if (!f.name.trim() || !f.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (isDelivery && (!f.zone || !f.address.trim() || !f.postcode.trim())) {
      setError("For delivery, please choose your area and enter your address and post code.");
      return;
    }
    if (!stripeReady) {
      setError("Payments are not configured yet. Please try again later.");
      return;
    }

    setSubmitting(true);
    try {
      // Price-free payload: items + contact + fulfilment metadata (no price/fee — spec §12).
      // The server re-prices the cart AND computes the delivery fee, returning the real total.
      const payload = toOrderPayload(cart, email.trim());
      const res = await api.createOrder(payload, session?.token);
      setOrderId(res.orderId);
      setClientSecret(res.clientSecret);
      setServerTotal(res.total);
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

        {/* What happens next — tailored to pickup vs delivery. */}
        <div className="mt-6 rounded-lg border-2 border-brand-ink/10 bg-brand-cream/60 p-5 text-left">
          <h3 className="font-display text-lg text-brand-ink">
            {isDelivery ? "Delivery" : "Pickup"} &amp; what happens next
          </h3>
          <ul className="mt-3 space-y-2 font-body text-sm text-brand-ink/70">
            <li>
              <span className="font-semibold text-brand-ink">1.</span> We&apos;ll email{" "}
              <span className="font-semibold">{email}</span> a confirmation and receipt.
            </li>
            <li>
              <span className="font-semibold text-brand-ink">2.</span>{" "}
              {isDelivery ? (
                <>
                  We&apos;ll message you on{" "}
                  <span className="font-semibold">{f.phone}</span> to confirm your{" "}
                  <span className="font-semibold">delivery</span>
                  {f.preferredDay ? <> for {f.preferredDay}</> : null}.
                </>
              ) : (
                <>
                  We&apos;ll message you on{" "}
                  <span className="font-semibold">{f.phone}</span> to confirm your{" "}
                  <span className="font-semibold">pickup</span> from{" "}
                  <span className="font-semibold">{LEGAL.pickupAddress}</span>.
                </>
              )}
            </li>
            <li>
              <span className="font-semibold text-brand-ink">3.</span> Everything is
              handmade fresh so it&apos;s as good as possible when it reaches you.
            </li>
          </ul>
          <p className="mt-4 font-body text-sm text-brand-ink/70">
            Questions, or need to change your order? Email us at{" "}
            <a
              href={`mailto:${LEGAL.contactEmail}`}
              className="font-semibold text-brand-red underline-offset-4 hover:underline"
            >
              {LEGAL.contactEmail}
            </a>{" "}
            or call{" "}
            <a
              href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}
              className="font-semibold text-brand-red underline-offset-4 hover:underline"
            >
              {LEGAL.phone}
            </a>{" "}
            with your order number.
          </p>
        </div>

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
    const payable = serverTotal ?? totalEstimate;
    return (
      <div className="mx-auto max-w-lg">
        <h2 className="mb-1 font-display text-2xl text-brand-ink">Payment</h2>
        <p className="mb-6 font-body text-sm text-brand-ink/60">
          Order #{orderId} · we re-priced your cart server-side
          {isDelivery ? " (including delivery)" : ""} — total{" "}
          <span className="font-semibold">${payable.toFixed(2)}</span>.
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
            amountLabel={`$${payable.toFixed(2)}`}
            onConfirmed={() => setStep("confirmed")}
          />
        </Elements>
      </div>
    );
  }

  // --- Cart step ---
  return (
    <form onSubmit={handleCreateOrder} className="mx-auto max-w-2xl space-y-10">
      {/* Pre-order heads-up so expectations are set before payment. */}
      <div className="rounded-lg border-2 border-brand-red/20 bg-brand-red/5 px-4 py-3 font-body text-sm text-brand-ink/70">
        <span className="font-semibold text-brand-ink">Pre-order only.</span> Everything is
        handmade fresh to order ({LEGAL.leadTime}). Choose{" "}
        <span className="font-semibold">pickup</span> from {LEGAL.pickupAddress} or{" "}
        <span className="font-semibold">delivery</span> across Auckland at checkout.
      </div>

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

      {/* Flavour — one dumpling type per order */}
      {menuItems.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl text-brand-ink">
            2. Choose your flavour
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {menuItems.map((item) => {
              const selected = cart.flavour === item.name;
              return (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => selectFlavour(item.name)}
                  aria-pressed={selected}
                  className={
                    "rounded-xl border-2 p-5 text-left transition-all " +
                    (selected
                      ? "border-brand-red bg-brand-red/5 ring-2 ring-brand-red/30"
                      : "border-brand-ink/10 bg-brand-cream hover:border-brand-red/40")
                  }
                >
                  <span className="font-display text-xl text-brand-ink">
                    {item.name}
                  </span>
                  {item.tagline && (
                    <p className="mt-1 font-body text-sm text-brand-ink/60">
                      {item.tagline}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Extras */}
      {extras.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl text-brand-ink">
            3. Add extras{" "}
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

      {/* Fulfilment — pickup or delivery */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-brand-ink">4. Pickup or delivery</h2>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Fulfilment method">
          <button
            type="button"
            onClick={() => setMethod("Pickup")}
            aria-pressed={!isDelivery}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              !isDelivery
                ? "border-brand-red bg-brand-red/5 ring-2 ring-brand-red/30"
                : "border-brand-ink/10 bg-brand-cream hover:border-brand-red/40",
            )}
          >
            <span className="font-display text-lg text-brand-ink">Pickup</span>
            <p className="mt-1 font-body text-sm text-brand-ink/60">
              Collect from {LEGAL.pickupAddress}. Free.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMethod("Delivery")}
            aria-pressed={isDelivery}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              isDelivery
                ? "border-brand-red bg-brand-red/5 ring-2 ring-brand-red/30"
                : "border-brand-ink/10 bg-brand-cream hover:border-brand-red/40",
            )}
          >
            <span className="font-display text-lg text-brand-ink">Delivery</span>
            <p className="mt-1 font-body text-sm text-brand-ink/60">
              Across Auckland. From $2 — free on orders of 60+ dumplings.
            </p>
          </button>
        </div>

        {isDelivery && (
          <div className="space-y-4 rounded-lg border-2 border-brand-ink/10 bg-brand-cream/60 p-4">
            <div>
              <Label htmlFor="zone">Delivery area</Label>
              <select
                id="zone"
                required
                value={f.zone ?? ""}
                onChange={(e) =>
                  updateFulfilment({ zone: (e.target.value || null) as DeliveryZone | null })
                }
                className={fieldClasses}
              >
                <option value="" disabled>
                  Choose your area…
                </option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {DELIVERY_ZONE_LABEL[z]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="address">Delivery address</Label>
              <Input
                id="address"
                required={isDelivery}
                value={f.address}
                onChange={(e) => updateFulfilment({ address: e.target.value })}
                placeholder="Street address, suburb"
                autoComplete="street-address"
              />
            </div>
            <div>
              <Label htmlFor="postcode">Post code</Label>
              <Input
                id="postcode"
                required={isDelivery}
                value={f.postcode}
                onChange={(e) => updateFulfilment({ postcode: e.target.value })}
                placeholder="e.g. 1023"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="preferredDay">
              Preferred {isDelivery ? "delivery" : "pickup"} day
            </Label>
            <Input
              id="preferredDay"
              value={f.preferredDay}
              onChange={(e) => updateFulfilment({ preferredDay: e.target.value })}
              placeholder="e.g. Saturday, or a date"
            />
          </div>
          <div>
            <Label htmlFor="preferredTime">Preferred time</Label>
            <select
              id="preferredTime"
              value={f.preferredTime}
              onChange={(e) => updateFulfilment({ preferredTime: e.target.value })}
              className={fieldClasses}
            >
              <option value="">No preference</option>
              {TIME_WINDOWS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">
            {isDelivery ? "Delivery" : "Pickup"} notes{" "}
            <span className="font-normal text-brand-ink/50">(optional)</span>
          </Label>
          <textarea
            id="notes"
            value={f.notes}
            onChange={(e) => updateFulfilment({ notes: e.target.value })}
            placeholder={
              isDelivery
                ? "Gate code, drop-off instructions, etc."
                : "Anything we should know?"
            }
            rows={2}
            className={fieldClasses}
          />
        </div>
      </section>

      {/* Contact + total */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-brand-ink">5. Your details</h2>
        {!session && (
          <p className="font-body text-sm text-brand-ink/60">
            Ordering as a guest.{" "}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Log in
            </Link>{" "}
            to save this order to your account — checkout is exactly the same either way.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              required
              value={f.name}
              onChange={(e) => updateFulfilment({ name: e.target.value })}
              placeholder="First and last name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={f.phone}
              onChange={(e) => updateFulfilment({ phone: e.target.value })}
              placeholder="e.g. 021 234 5678"
              autoComplete="tel"
            />
          </div>
        </div>
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

        {(cart.tier || cart.flavour) && (
          <p className="font-body text-sm text-brand-ink/60">
            {cart.tier ? `${cart.tier.quantity} dumplings` : ""}
            {cart.tier && cart.flavour ? " · " : ""}
            {cart.flavour ?? ""}
            {" · "}
            {isDelivery ? "Delivery" : "Pickup"}
          </p>
        )}

        <div className="space-y-2 border-t-2 border-brand-ink/10 pt-4">
          <div className="flex items-center justify-between font-body text-sm text-brand-ink/70">
            <span>Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          {isDelivery && (
            <div className="flex items-center justify-between font-body text-sm text-brand-ink/70">
              <span>Delivery {f.zone ? `(${DELIVERY_ZONE_LABEL[f.zone]})` : ""}</span>
              <span className="tabular-nums">
                {deliveryEstimate > 0 ? `$${deliveryEstimate.toFixed(2)}` : "Free"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-display text-xl text-brand-ink">Total</span>
            <span className="font-display text-2xl text-brand-red">
              ${totalEstimate.toFixed(2)}
            </span>
          </div>
        </div>
        <p className="font-body text-xs text-brand-ink/50">
          Your total{isDelivery ? " and delivery fee are" : " is"} calculated and verified by
          our server at checkout
          {isDelivery ? " — orders of 60+ dumplings are delivered free" : ""}.
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
