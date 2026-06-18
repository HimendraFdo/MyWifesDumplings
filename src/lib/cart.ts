import type { PricingTier, Extra } from "@/types";
import type { CartLine, CreateOrderRequest } from "@/lib/api/types";

/**
 * Client-side cart model for the order page.
 *
 * The cart = exactly one selected pricing tier (+ optional extras with quantities).
 * `menuItemId` is always the Sanity `_id` of a PRICED document (a pricingTier or an
 * extra) — never a `menuItem` id, which has no price (spec §5 / WP-8 contract).
 *
 * Prices are tracked here ONLY for display (showing the running total in the UI).
 * They are NEVER sent to the API: {@link toOrderPayload} emits just
 * { menuItemId, quantity } so the server re-prices everything (spec §12).
 */
export interface CartState {
  tier: PricingTier | null;
  /** extraId -> quantity (>0). */
  extras: Record<string, number>;
  /** Chosen dumpling type name (one per order). Display + sent as order metadata. */
  flavour: string | null;
}

export const emptyCart: CartState = { tier: null, extras: {}, flavour: null };

/** Display-only subtotal in dollars. The authoritative total is computed server-side. */
export function cartSubtotal(cart: CartState, extras: Extra[]): number {
  let total = cart.tier ? cart.tier.price : 0;
  for (const e of extras) {
    const qty = cart.extras[e._id] ?? 0;
    total += e.price * qty;
  }
  return total;
}

/** True when the cart can be submitted (a tier AND a flavour must be chosen). */
export function isCartSubmittable(cart: CartState): boolean {
  return cart.tier !== null && !!cart.flavour;
}

/**
 * Build the wire payload for POST /api/orders.
 *
 * SECURITY (spec §12): the returned lines contain ONLY `menuItemId` and `quantity`.
 * No price/amount/total is ever included. This is the single chokepoint the test
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

/** Compose the full create-order request (price-free, spec §12). The chosen flavour is
 *  order metadata — it travels alongside the lines but is NOT a priced line item. */
export function toOrderPayload(
  cart: CartState,
  customerEmail: string,
): CreateOrderRequest {
  const payload: CreateOrderRequest = { customerEmail, items: toCartLines(cart) };
  if (cart.flavour) payload.flavour = cart.flavour;
  return payload;
}
