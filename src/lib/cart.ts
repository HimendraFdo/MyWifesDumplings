import type { PricingTier, Extra } from "@/types";
import type {
  CartLine,
  CreateOrderRequest,
  DeliveryZone,
  FulfilmentMethod,
} from "@/lib/api/types";
import {
  DELIVERY_ZONE_FEE,
  DELIVERY_ZONE_VALUE,
  FULFILMENT_VALUE,
} from "@/lib/api/types";

/**
 * Client-side cart model for the order page.
 *
 * The cart = exactly one selected pricing tier (+ optional extras with quantities) plus the
 * customer's contact + fulfilment (pickup/delivery) choices. `menuItemId` is always the Sanity
 * `_id` of a PRICED document (a pricingTier or an extra) — never a `menuItem` id (spec §5).
 *
 * Prices are tracked here ONLY for display (showing the running total in the UI). They are NEVER
 * sent to the API: {@link toOrderPayload} emits just { menuItemId, quantity } plus metadata so the
 * server re-prices everything AND computes the delivery fee (spec §12).
 */
export interface Fulfilment {
  method: FulfilmentMethod;
  /** Delivery area (required when method === "Delivery"). */
  zone: DeliveryZone | null;
  name: string;
  phone: string;
  /** Delivery-only fields. */
  address: string;
  postcode: string;
  notes: string;
  preferredDay: string;
  preferredTime: string;
}

export interface CartState {
  tier: PricingTier | null;
  /** extraId -> quantity (>0). */
  extras: Record<string, number>;
  /** Chosen dumpling type name (one per order). Display + sent as order metadata. */
  flavour: string | null;
  fulfilment: Fulfilment;
}

export const emptyFulfilment: Fulfilment = {
  method: "Pickup",
  zone: null,
  name: "",
  phone: "",
  address: "",
  postcode: "",
  notes: "",
  preferredDay: "",
  preferredTime: "",
};

export const emptyCart: CartState = {
  tier: null,
  extras: {},
  flavour: null,
  fulfilment: emptyFulfilment,
};

/** Display-only items subtotal in dollars (excludes delivery). Server is authoritative. */
export function cartSubtotal(cart: CartState, extras: Extra[]): number {
  let total = cart.tier ? cart.tier.price : 0;
  for (const e of extras) {
    const qty = cart.extras[e._id] ?? 0;
    total += e.price * qty;
  }
  return total;
}

/**
 * Display-only delivery fee ESTIMATE. The server is authoritative. Mirrors the server's zone fees
 * and the "60+ dumplings = free" rule, which we can tell from the chosen tier's piece count.
 */
export function estimateDeliveryFee(cart: CartState): number {
  const { method, zone } = cart.fulfilment;
  if (method !== "Delivery" || !zone) return 0;
  const pieces = cart.tier?.quantity ?? 0;
  if (pieces >= 60) return 0;
  return DELIVERY_ZONE_FEE[zone];
}

/** Display-only estimated grand total (items + estimated delivery). */
export function cartTotalEstimate(cart: CartState, extras: Extra[]): number {
  return cartSubtotal(cart, extras) + estimateDeliveryFee(cart);
}

/** True when the cart's items are chosen (a tier AND a flavour). */
export function hasItems(cart: CartState): boolean {
  return cart.tier !== null && !!cart.flavour;
}

/**
 * True when the whole order can be submitted: items chosen, name + phone given, and — for delivery —
 * a zone, address, and post code. Mirrors the backend's conditional validation so the button only
 * enables when the request will pass server validation.
 */
export function isCartSubmittable(cart: CartState): boolean {
  if (!hasItems(cart)) return false;
  const f = cart.fulfilment;
  if (!f.name.trim() || !f.phone.trim()) return false;
  if (f.method === "Delivery") {
    if (!f.zone) return false;
    if (!f.address.trim() || !f.postcode.trim()) return false;
  }
  return true;
}

/**
 * Build the wire payload for POST /api/orders.
 *
 * SECURITY (spec §12): the returned lines contain ONLY `menuItemId` and `quantity`.
 * No price/amount/total/fee is ever included. This is the single chokepoint the test
 * asserts against — keep it free of any pricing field.
 */
export function toCartLines(cart: CartState): CartLine[] {
  const lines: CartLine[] = [];
  if (cart.tier) {
    lines.push({ menuItemId: cart.tier._id, quantity: 1 });
  }
  for (const [extraId, qty] of Object.entries(cart.extras)) {
    if (qty > 0) lines.push({ menuItemId: extraId, quantity: qty });
  }
  return lines;
}

/** Compose the full create-order request (price-free, spec §12). The chosen flavour and the
 *  contact/fulfilment fields are order metadata; the server derives the delivery fee from
 *  method/zone. Delivery-only fields are omitted for pickup. */
export function toOrderPayload(
  cart: CartState,
  customerEmail: string,
): CreateOrderRequest {
  const f = cart.fulfilment;
  const payload: CreateOrderRequest = {
    customerEmail,
    items: toCartLines(cart),
    customerName: f.name.trim(),
    customerPhone: f.phone.trim(),
    method: FULFILMENT_VALUE[f.method],
  };
  if (cart.flavour) payload.flavour = cart.flavour;
  if (f.notes.trim()) payload.deliveryNotes = f.notes.trim();
  if (f.preferredDay.trim()) payload.preferredDay = f.preferredDay.trim();
  if (f.preferredTime.trim()) payload.preferredTime = f.preferredTime.trim();
  if (f.method === "Delivery" && f.zone) {
    payload.zone = DELIVERY_ZONE_VALUE[f.zone];
    payload.deliveryAddress = f.address.trim();
    payload.deliveryPostcode = f.postcode.trim();
  }
  return payload;
}
