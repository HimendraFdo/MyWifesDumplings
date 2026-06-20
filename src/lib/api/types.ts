// Wire types for the .NET ordering/payments API (spec §8). These mirror the C# DTOs
// in backend/src/MyWifesDumplings.Api. The frontend NEVER sends a price/amount/total —
// only { menuItemId, quantity } — and the server computes the total (spec §5/§12).

/** A single cart line on the wire. Deliberately has NO price field (spec §12). */
export interface CartLine {
  menuItemId: string;
  quantity: number;
}

/**
 * Fulfilment method. Sent as the numeric value (the API binds enums by integer, like OrderStatus).
 * Pickup = collect from the Epsom kitchen (free); Delivery = to the customer's address (zone fee).
 */
export type FulfilmentMethod = "Pickup" | "Delivery";

export const FULFILMENT_VALUE: Record<FulfilmentMethod, number> = {
  Pickup: 0,
  Delivery: 1,
};

/** Auckland delivery area. Sent as the numeric value. Mirrors the backend DeliveryZone enum. */
export type DeliveryZone = "EastSouth" | "AucklandCentral" | "WestNorth";

export const DELIVERY_ZONE_VALUE: Record<DeliveryZone, number> = {
  EastSouth: 1,
  AucklandCentral: 2,
  WestNorth: 3,
};

export const DELIVERY_ZONE_LABEL: Record<DeliveryZone, string> = {
  EastSouth: "East & South Auckland",
  AucklandCentral: "Auckland Central",
  WestNorth: "West & North Auckland",
};

/** Display-only base fee per zone (in dollars). The server is authoritative — see {@link estimateDeliveryFee}. */
export const DELIVERY_ZONE_FEE: Record<DeliveryZone, number> = {
  EastSouth: 2,
  AucklandCentral: 4,
  WestNorth: 8,
};

/** Body of POST /api/orders. Price-free cart lines + contact + fulfilment metadata.
 *  No price/amount/total/fee is ever sent — the server computes the total AND delivery fee (§12). */
export interface CreateOrderRequest {
  customerEmail: string;
  items: CartLine[];
  flavour?: string;
  customerName?: string;
  customerPhone?: string;
  /** Numeric FulfilmentMethod value (see FULFILMENT_VALUE). */
  method?: number;
  /** Numeric DeliveryZone value (see DELIVERY_ZONE_VALUE); omitted for pickup. */
  zone?: number;
  deliveryAddress?: string;
  deliveryPostcode?: string;
  deliveryNotes?: string;
  preferredDay?: string;
  preferredTime?: string;
}

/** Response of POST /api/orders. Includes the server-computed fee + grand total. */
export interface CreateOrderResponse {
  orderId: number;
  clientSecret: string;
  deliveryFee: number;
  total: number;
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  /** "Pickup" | "Delivery" (string form of the backend enum). */
  method: string;
  /** Zone name (e.g. "AucklandCentral") for delivery orders; null for pickup. */
  zone: string | null;
  deliveryFee: number;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryPostcode: string | null;
  deliveryNotes: string | null;
  preferredDay: string | null;
  preferredTime: string | null;
}

export interface OrderStatusAudit {
  id: number;
  orderId: number;
  adminEmail: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedAtUtc: string;
}
