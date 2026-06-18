// Wire types for the .NET ordering/payments API (spec §8). These mirror the C# DTOs
// in backend/src/MyWifesDumplings.Api. The frontend NEVER sends a price/amount/total —
// only { menuItemId, quantity } — and the server computes the total (spec §5/§12).

/** A single cart line on the wire. Deliberately has NO price field (spec §12). */
export interface CartLine {
  menuItemId: string;
  quantity: number;
}

/** Body of POST /api/orders. Customer email + price-free cart lines + chosen flavour.
 *  `flavour` is order metadata (it never affects price — see §12). */
export interface CreateOrderRequest {
  customerEmail: string;
  items: CartLine[];
  flavour?: string;
}

/** Response of POST /api/orders. */
export interface CreateOrderResponse {
  orderId: number;
  clientSecret: string;
}

/** Body of POST /api/auth/register. */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** Body of POST /api/auth/login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response of POST /api/auth/login. */
export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  email: string;
  roles: string[];
}

/** Order lifecycle statuses (spec §7). String form matches the read DTO; the numeric
 *  value matches the PATCH request body (the API binds the enum by its integer value). */
export type OrderStatus = "NotStarted" | "Ongoing" | "Completed";

export const ORDER_STATUS_VALUE: Record<OrderStatus, number> = {
  NotStarted: 0,
  Ongoing: 1,
  Completed: 2,
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NotStarted: "Not started",
  Ongoing: "Ongoing",
  Completed: "Completed",
};

export interface OrderLineSummary {
  menuItemId: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

/** Read model shared by admin list, "my orders", and guest lookup (spec §8). */
export interface OrderSummary {
  id: number;
  customerEmail: string;
  status: OrderStatus;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  total: number;
  items: OrderLineSummary[];
  flavour: string | null;
}
