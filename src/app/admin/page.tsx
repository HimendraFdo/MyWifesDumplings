"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, History, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type {
  OrderStatus,
  OrderStatusAudit,
  OrderSummary,
} from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { OrderCard } from "@/components/order/OrderCard";
import { AdminDialog } from "@/components/ui/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

const POLL_MS = 12_000;
const SEARCH_DEBOUNCE_MS = 300;
const STATUSES: OrderStatus[] = ["NotStarted", "Ongoing", "Completed"];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NotStarted: "Ongoing",
  Ongoing: "Completed",
};

export default function AdminPage() {
  const router = useRouter();
  const { session, loading: authLoading, isAdmin, logout } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [initialError, setInitialError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [completionOrder, setCompletionOrder] = useState<OrderSummary | null>(null);
  const [historyOrder, setHistoryOrder] = useState<OrderSummary | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const ordersRef = useRef<OrderSummary[] | null>(null);
  tokenRef.current = session?.token ?? null;
  ordersRef.current = orders;

  useEffect(() => {
    if (!authLoading && !session) router.replace("/login?redirect=/admin");
  }, [authLoading, session, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async ({ signal, manual = false }: { signal?: AbortSignal; manual?: boolean } = {}) => {
      const token = tokenRef.current;
      if (!token) return;
      if (manual) setRefreshing(true);
      try {
        const data = await api.adminOrders(token, {
          status: filter || undefined,
          search: debouncedSearch || undefined,
          signal,
        });
        setOrders(data);
        setLastRefreshed(new Date());
        setInitialError(null);
        setRefreshWarning(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return;
        const message = err instanceof ApiError ? err.message : "Could not load orders.";
        if (ordersRef.current === null) setInitialError(message);
        else {
          setRefreshWarning(
            "Orders could not be refreshed. Showing the last successful results.",
          );
        }
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [filter, debouncedSearch],
  );

  useEffect(() => {
    if (!session || !isAdmin) return;
    const controller = new AbortController();
    void load({ signal: controller.signal });
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [session, isAdmin, load]);

  async function transition(order: OrderSummary, to: OrderStatus) {
    if (!tokenRef.current || updatingId !== null) return;
    setUpdatingId(order.id);
    setActionError(null);
    try {
      const updated = await api.updateOrderStatus(order.id, to, tokenRef.current);
      setOrders((current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? current,
      );
      setCompletionOrder(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update the order.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function requestTransition(order: OrderSummary, next: OrderStatus) {
    if (next === "Completed") setCompletionOrder(order);
    else void transition(order, next);
  }

  if (authLoading || !session) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-brand-ink">Admins only</h1>
        <p className="mt-3 font-body text-brand-ink/70">
          This dashboard is restricted to the owner account.
        </p>
        <Button
          variant="outline"
          className="mt-6 min-h-11"
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
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="rounded-2xl border-2 border-brand-ink/10 bg-brand-cream/70 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
              Administration
            </p>
            <h1 className="mt-1 font-display text-3xl text-brand-ink sm:text-4xl">
              Orders
            </h1>
            <p className="mt-1 break-all font-body text-sm text-brand-ink/65">
              Signed in as {session.email}
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-body text-xs text-brand-ink/55">
              <Clock3 className="size-3.5" />
              {lastRefreshed
                ? `Last refreshed ${lastRefreshed.toLocaleTimeString()}`
                : "Waiting for first refresh"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={refreshing}
              onClick={() => void load({ manual: true })}
            >
              <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setPasswordOpen(true)}
            >
              <ShieldCheck className="mr-2 size-4" />
              Change password
            </Button>
            <Button variant="outline" className="min-h-11" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <section aria-label="Order filters" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="admin-order-search">Search orders</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-ink/45" />
            <Input
              id="admin-order-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number or customer email"
              className="h-12 pl-10 pr-12"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-0 top-0 flex size-12 cursor-pointer items-center justify-center text-brand-ink/50 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter by status">
          <FilterChip active={filter === ""} onClick={() => setFilter("")}>
            All
          </FilterChip>
          {STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
            >
              {ORDER_STATUS_LABEL[status]}
            </FilterChip>
          ))}
        </div>
      </section>

      {refreshWarning && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-amber-700/25 bg-amber-50 p-3 font-body text-sm text-amber-900"
        >
          {refreshWarning}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-brand-red/25 bg-red-50 p-3 font-body text-sm text-brand-red-dark"
        >
          {actionError}
        </p>
      )}

      <div className="mt-6 space-y-5">
        {orders === null && !initialError && (
          <p role="status" className="font-body text-brand-ink/60">
            Loading orders…
          </p>
        )}
        {orders === null && initialError && (
          <div role="alert" className="rounded-xl border-2 border-brand-red/20 p-5">
            <p className="font-body text-brand-red-dark">{initialError}</p>
            <Button className="mt-4 min-h-11" onClick={() => void load({ manual: true })}>
              Retry
            </Button>
          </div>
        )}
        {orders?.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-brand-ink/15 p-8 text-center font-body text-brand-ink/60">
            No orders match the current filters.
          </p>
        )}
        {orders?.map((order) => {
          const next = NEXT_STATUS[order.status];
          const isUpdating = updatingId === order.id;
          return (
            <OrderCard key={order.id} order={order}>
              <div className="flex flex-wrap items-center gap-2">
                {!order.isPaid && (
                  <span className="mr-auto font-body text-sm text-brand-ink/55">
                    Awaiting payment — status locked until paid.
                  </span>
                )}
                {order.isPaid && next && (
                  <Button
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => requestTransition(order, next)}
                    className="min-h-11 bg-brand-red text-brand-cream hover:bg-brand-red-dark"
                  >
                    {isUpdating ? "Updating…" : `Mark ${ORDER_STATUS_LABEL[next]}`}
                  </Button>
                )}
                {order.isPaid && order.status === "Completed" && (
                  <span className="mr-auto font-body text-sm font-semibold text-green-700">
                    Completed
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={isUpdating}
                  onClick={() => setHistoryOrder(order)}
                >
                  <History className="mr-2 size-4" />
                  View history
                </Button>
              </div>
            </OrderCard>
          );
        })}
      </div>

      <CompletionDialog
        order={completionOrder}
        pending={completionOrder?.id === updatingId}
        onClose={() => {
          if (updatingId === null) setCompletionOrder(null);
        }}
        onConfirm={() => {
          if (completionOrder) void transition(completionOrder, "Completed");
        }}
      />
      <HistoryDialog
        order={historyOrder}
        token={session.token}
        onClose={() => setHistoryOrder(null)}
      />
      <ChangePasswordDialog
        open={passwordOpen}
        token={session.token}
        onClose={() => setPasswordOpen(false)}
        onSuccess={() => {
          logout();
          router.replace("/login?passwordChanged=true");
        }}
      />
    </main>
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
      aria-pressed={active}
      className={`min-h-11 cursor-pointer rounded-full border-2 px-4 py-2 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red ${
        active
          ? "border-brand-red bg-brand-red text-brand-cream"
          : "border-brand-ink/15 text-brand-ink hover:border-brand-red/40"
      }`}
    >
      {children}
    </button>
  );
}

function CompletionDialog({
  order,
  pending,
  onClose,
  onConfirm,
}: {
  order: OrderSummary | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminDialog
      open={order !== null}
      onClose={onClose}
      title={order ? `Mark order #${order.id} as completed?` : "Complete order"}
      description="This status change cannot be reversed."
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" className="min-h-11" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="min-h-11 bg-brand-red text-brand-cream hover:bg-brand-red-dark"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Updating…" : "Mark completed"}
        </Button>
      </div>
    </AdminDialog>
  );
}

function HistoryDialog({
  order,
  token,
  onClose,
}: {
  order: OrderSummary | null;
  token: string;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<OrderStatusAudit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!order) {
      setRecords(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setRecords(null);
    setError(null);
    api
      .getOrderAudit(order.id, token, controller.signal)
      .then(setRecords)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "Could not load order history.");
      });
    return () => controller.abort();
  }, [order, token, retryKey]);

  return (
    <AdminDialog
      open={order !== null}
      onClose={onClose}
      title={order ? `Order #${order.id} history` : "Order history"}
      description="Status changes are listed oldest first."
    >
      {records === null && !error && <p role="status">Loading history…</p>}
      {error && (
        <div role="alert">
          <p className="font-body text-sm text-brand-red-dark">{error}</p>
          <Button
            variant="outline"
            className="mt-3 min-h-11"
            onClick={() => setRetryKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {records?.length === 0 && (
        <p className="font-body text-sm text-brand-ink/60">
          No status changes recorded.
        </p>
      )}
      {records && records.length > 0 && (
        <ol className="space-y-3">
          {records.map((record) => (
            <li key={record.id} className="rounded-lg border border-brand-ink/10 p-3">
              <p className="font-body text-sm font-semibold">
                {ORDER_STATUS_LABEL[record.previousStatus]} →{" "}
                {ORDER_STATUS_LABEL[record.newStatus]}
              </p>
              <p className="mt-1 break-all font-body text-xs text-brand-ink/60">
                {record.adminEmail}
              </p>
              <time
                dateTime={record.changedAtUtc}
                className="font-body text-xs text-brand-ink/50"
              >
                {new Date(record.changedAtUtc).toLocaleString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </AdminDialog>
  );
}

function ChangePasswordDialog({
  open,
  token,
  onClose,
  onSuccess,
}: {
  open: boolean;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    if (pending) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api.changeAdminPassword(
        { currentPassword, newPassword, confirmPassword },
        token,
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
      setPending(false);
    }
  }

  return (
    <AdminDialog
      open={open}
      onClose={close}
      title="Change administrator password"
      description="You will be signed out after the password is changed."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="current-admin-password">Current password</Label>
          <PasswordInput
            id="current-admin-password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="new-admin-password">New password</Label>
          <PasswordInput
            id="new-admin-password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirm-admin-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-admin-password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="font-body text-sm text-brand-red-dark">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={pending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="min-h-11 bg-brand-red text-brand-cream hover:bg-brand-red-dark"
            disabled={pending}
          >
            {pending ? "Changing password…" : "Change password"}
          </Button>
        </div>
      </form>
    </AdminDialog>
  );
}
