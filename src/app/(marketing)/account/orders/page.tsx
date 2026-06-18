"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import type { OrderSummary } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { OrderCard } from "@/components/order/OrderCard";
import { Button } from "@/components/ui/button";

export default function MyOrdersPage() {
  const router = useRouter();
  const { session, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect anonymous users to login once the initial auth read settles.
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/login?redirect=/account/orders");
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    api
      .myOrders(session.token, controller.signal)
      .then(setOrders)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          logout();
          router.replace("/login?redirect=/account/orders");
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "Could not load your orders.",
        );
      });
    return () => controller.abort();
  }, [session, logout, router]);

  if (authLoading || !session) return null;

  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading subheading={`Signed in as ${session.email}`}>
          My Orders
        </SectionHeading>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>

        <div className="mt-6 space-y-5">
          {error && <p className="font-body text-brand-red">{error}</p>}
          {!error && orders === null && (
            <p className="font-body text-brand-ink/60">Loading your orders…</p>
          )}
          {orders && orders.length === 0 && (
            <div className="rounded-xl border-2 border-brand-ink/10 bg-brand-cream p-8 text-center">
              <p className="font-body text-brand-ink/70">
                You haven&apos;t placed any orders yet.
              </p>
              <Link
                href="/order"
                className="mt-4 inline-block font-body font-semibold text-brand-red hover:underline"
              >
                Place your first order →
              </Link>
            </div>
          )}
          {orders?.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}
