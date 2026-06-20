import type { OrderSummary } from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Maps the backend zone enum string to a human label. */
const ZONE_LABEL: Record<string, string> = {
  EastSouth: "East & South Auckland",
  AucklandCentral: "Auckland Central",
  WestNorth: "West & North Auckland",
};

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

      {order.flavour && (
        <p className="mt-3 font-body text-sm text-brand-ink/80">
          Flavour: <span className="font-semibold">{order.flavour}</span>
        </p>
      )}

      {/* Fulfilment (pickup vs delivery) details. */}
      <div className="mt-3 rounded-lg bg-brand-ink/5 p-3 font-body text-sm text-brand-ink/80">
        <p>
          <span className="font-semibold">
            {order.method === "Delivery" ? "Delivery" : "Pickup"}
          </span>
          {order.method === "Delivery" && order.zone && (
            <> · {ZONE_LABEL[order.zone] ?? order.zone}</>
          )}
        </p>
        {order.method === "Delivery" && order.deliveryAddress && (
          <p className="text-brand-ink/60">
            {order.deliveryAddress}
            {order.deliveryPostcode ? `, ${order.deliveryPostcode}` : ""}
          </p>
        )}
        {(order.customerName || order.customerPhone) && (
          <p className="text-brand-ink/60">
            {[order.customerName, order.customerPhone].filter(Boolean).join(" · ")}
          </p>
        )}
        {(order.preferredDay || order.preferredTime) && (
          <p className="text-brand-ink/60">
            Preferred:{" "}
            {[order.preferredDay, order.preferredTime].filter(Boolean).join(", ")}
          </p>
        )}
        {order.deliveryNotes && (
          <p className="text-brand-ink/60">Notes: {order.deliveryNotes}</p>
        )}
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

      {order.method === "Delivery" && (
        <div className="mt-3 flex justify-between border-t border-brand-ink/10 pt-3 font-body text-sm text-brand-ink/70">
          <span>Delivery</span>
          <span className="tabular-nums">
            {order.deliveryFee > 0 ? `$${order.deliveryFee.toFixed(2)}` : "Free"}
          </span>
        </div>
      )}

      <div
        className={cn(
          "mt-3 flex justify-between font-body font-semibold text-brand-ink",
          order.method === "Delivery"
            ? "pt-1"
            : "border-t border-brand-ink/10 pt-3",
        )}
      >
        <span>Total</span>
        <span className="tabular-nums">${order.total.toFixed(2)}</span>
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
