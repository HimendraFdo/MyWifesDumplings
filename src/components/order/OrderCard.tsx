import type { OrderSummary } from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  NotStarted: "bg-brand-ink/10 text-brand-ink",
  Ongoing: "bg-brand-red/15 text-brand-red-dark",
  Completed: "bg-green-600/15 text-green-700",
};

export function StatusBadge({ status }: { status: OrderSummary["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-body text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-brand-ink/10 text-brand-ink",
      )}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** Read-only summary of one order, shared by lookup / my-orders / admin views. */
export function OrderCard({
  order,
  children,
}: {
  order: OrderSummary;
  /** Optional admin controls rendered in the footer. */
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-brand-ink/10 bg-brand-cream p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl text-brand-ink">Order #{order.id}</p>
          <p className="font-body text-sm text-brand-ink/60">{order.customerEmail}</p>
          <p className="font-body text-xs text-brand-ink/50">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
          <span
            className={cn(
              "font-body text-xs",
              order.isPaid ? "text-green-700" : "text-brand-ink/50",
            )}
          >
            {order.isPaid ? "Paid" : "Awaiting payment"}
          </span>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-brand-ink/10 border-t border-brand-ink/10">
        {order.items.map((item, i) => (
          <li
            key={`${item.menuItemId}-${i}`}
            className="flex justify-between gap-4 py-2 font-body text-sm text-brand-ink/80"
          >
            <span>
              {item.nameSnapshot}
              {item.quantity > 1 && (
                <span className="text-brand-ink/50"> × {item.quantity}</span>
              )}
            </span>
            <span className="tabular-nums">${item.lineTotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-brand-ink/10 pt-3 font-body font-semibold text-brand-ink">
        <span>Total</span>
        <span className="tabular-nums">${order.total.toFixed(2)}</span>
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
