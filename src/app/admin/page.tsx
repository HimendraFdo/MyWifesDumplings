"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { OrderStatus, OrderSummary } from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { OrderCard } from "@/components/order/OrderCard";
import { Button } from "@/components/ui/button";

const POLL_MS = 12_000; // spec §9 — polling; SignalR is Phase 2 only.
const STATUSES: OrderStatus[] = ["NotStarted", "Ongoing", "Completed"];

// The owner moves orders forward: NotStarted → Ongoing → Completed (spec §7).
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NotStarted: "Ongoing",
  Ongoing: "Completed",
};

export default function AdminPage() {
  const router = useRouter();
  const { session, loading: authLoading, isAdmin, logout } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = session?.token ?? null;

  // --- Access control (spec §12): anonymous → login; non-admin → blocked. ---
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/login?redirect=/admin");
    }
  }, [authLoading, session, router]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const token = tokenRef.current;
      if (!token) return;
      try {
        const data = await api.adminOrders(token, filter || undefined, signal);
        setOrders(data);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // Token expired or not an admin — handled by the guard below; stop polling.
          setError(null);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Could not load orders.");
      }
    },
    [filter],
  );

  // Initial load + polling refresh while an admin is signed in.
  useEffect(() => {
    if (!session || !isAdmin) return;
    const controller = new AbortController();
    load(controller.signal);
    const timer = setInterval(() => load(), POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [session, isAdmin, load]);

  async function transition(order: OrderSummary, to: OrderStatus) {
    if (!tokenRef.current) return;
    setUpdatingId(order.id);
    try {
      const updated = await api.updateOrderStatus(order.id, to, tokenRef.current);
      setOrders((prev) =>
        prev ? prev.map((o) => (o.id === updated.id ? updated : o)) : prev,
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update the order.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading || !session) return null;

  // Signed in but not an Admin → block gracefully (403 surface), no data fetched.
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-brand-ink">Admins only</h1>
        <p className="mt-3 font-body text-brand-ink/70">
          This dashboard is restricted to the owner account.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            logout();
            router.replace("/login?redirect=/admin");
          }}
        >
          Switch account
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-ink">Orders</h1>
          <p className="font-body text-sm text-brand-ink/60">
            Live view · refreshes every {POLL_MS / 1000}s · {session.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>

      {/* Status filter (spec §8 ?status=) */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip active={filter === ""} onClick={() => setFilter("")}>
          All
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {ORDER_STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>

      {error && <p className="mt-6 font-body text-brand-red">{error}</p>}

      <div className="mt-6 space-y-5">
        {orders === null && (
          <p className="font-body text-brand-ink/60">Loading orders…</p>
        )}
        {orders && orders.length === 0 && (
          <p className="font-body text-brand-ink/60">No orders to show.</p>
        )}
        {orders?.map((order) => {
          const next = NEXT_STATUS[order.status];
          return (
            <OrderCard key={order.id} order={order}>
              <div className="flex flex-wrap items-center gap-2">
                {!order.isPaid && (
                  <span className="font-body text-sm text-brand-ink/50">
                    Awaiting payment — status locked until paid.
                  </span>
                )}
                {order.isPaid && next && (
                  <Button
                    size="sm"
                    disabled={updatingId === order.id}
                    onClick={() => transition(order, next)}
                    className="bg-brand-red text-brand-cream hover:bg-brand-red-dark"
                  >
                    {updatingId === order.id
                      ? "Updating…"
                      : `Mark ${ORDER_STATUS_LABEL[next]}`}
                  </Button>
                )}
                {order.isPaid && order.status === "Completed" && (
                  <span className="font-body text-sm text-green-700">
                    ✓ Completed
                  </span>
                )}
              </div>
            </OrderCard>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border-2 px-4 py-1.5 font-body text-sm transition-colors " +
        (active
          ? "border-brand-red bg-brand-red text-brand-cream"
          : "border-brand-ink/15 text-brand-ink hover:border-brand-red/40")
      }
    >
      {children}
    </button>
  );
}
