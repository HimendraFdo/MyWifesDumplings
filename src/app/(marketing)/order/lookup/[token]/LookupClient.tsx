"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { OrderSummary } from "@/lib/api/types";
import { OrderCard } from "@/components/order/OrderCard";

const LOOKUP_TIMEOUT_MS = 15_000;

/** Guest order lookup. Resolves the emailed token to the order, client-side. */
export function LookupClient({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(
      () => controller.abort("lookup-timeout"),
      LOOKUP_TIMEOUT_MS,
    );

    setLoading(true);
    setError(null);
    setOrder(null);

    api
      .lookupOrder(token, controller.signal)
      .then((response) => {
        if (active) setOrder(response);
      })
      .catch((lookupError) => {
        if (!active) return;

        setError(
          controller.signal.aborted
            ? "The order lookup took too long. Please try again."
            : lookupError instanceof ApiError && lookupError.status === 404
              ? "We couldn't find an order for that link. Please check the link from your email."
              : lookupError instanceof ApiError
                ? lookupError.message
                : "Something went wrong looking up your order.",
        );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt, token]);

  if (loading) {
    return (
      <div
        className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle
          className="h-7 w-7 animate-spin text-brand-red"
          aria-hidden="true"
        />
        <p className="font-body text-brand-ink/60">Looking up your order…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-xl border-2 border-brand-red/15 bg-brand-cream p-6 text-center"
        role="alert"
      >
        <p className="max-w-sm font-body text-brand-red">{error}</p>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-brand-red px-4 py-2 font-body text-sm font-semibold text-brand-red transition-colors duration-200 hover:bg-brand-red hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  if (!order) return null;

  return <OrderCard order={order} />;
}
