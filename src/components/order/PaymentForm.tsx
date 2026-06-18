"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

/**
 * Stripe Payment Element step (spec §5). Card data is entered into Stripe's iframe and
 * confirmed against the clientSecret — it goes browser → Stripe directly and never
 * touches our API. On success we show a PENDING state; the backend webhook is the
 * source of truth for "paid", so the UI never asserts payment as final (spec §5).
 */
export function PaymentForm({
  amountLabel,
  onConfirmed,
}: {
  amountLabel: string;
  onConfirmed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // redirect: "if_required" keeps card confirmation inline (no full-page redirect)
    // and lets us show our own pending/confirmation state.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment could not be completed.");
      setSubmitting(false);
      return;
    }

    // Card succeeded/processing on Stripe's side. We do NOT mark the order paid here —
    // that is finalized by the backend webhook (spec §5). We just advance the UI.
    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing" ||
        paymentIntent.status === "requires_capture")
    ) {
      onConfirmed();
      return;
    }

    setError("Payment is still incomplete. Please check your card details.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <FieldError>{error}</FieldError>
      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="h-12 w-full bg-brand-red text-base text-brand-cream hover:bg-brand-red-dark"
      >
        {submitting ? "Processing…" : `Pay ${amountLabel}`}
      </Button>
      <p className="text-center font-body text-xs text-brand-ink/50">
        Card details are handled securely by Stripe. We never see your card number.
      </p>
    </form>
  );
}
