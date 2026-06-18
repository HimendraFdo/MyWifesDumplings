"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import type { OrderSummary } from "@/lib/api/types";
import { OrderCard } from "@/components/order/OrderCard";

/** Guest order lookup (spec §8). Resolves the emailed token → the order, client-side. */
export function LookupClient({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .lookupOrder(token, controller.signal)
      .then((res) => setOrder(res))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "We couldn't find an order for that link. Please check the link from your email."
            : err instanceof ApiError
              ? err.message
              : "Something went wrong looking up your order.",
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token]);

  if (loading) {
    return <p className="font-body text-brand-ink/60">Looking up your order…</p>;
  }
  if (error) {
    return <p className="font-body text-brand-red">{error}</p>;
  }
  if (!order) return null;

  return <OrderCard order={order} />;
}
