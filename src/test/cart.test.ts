import { describe, it, expect } from "vitest";
import {
  cartSubtotal,
  isCartSubmittable,
  toCartLines,
  toOrderPayload,
  emptyCart,
  type CartState,
} from "@/lib/cart";
import type { PricingTier, Extra } from "@/types";

const tier: PricingTier = {
  _id: "tier_60",
  quantity: 60,
  price: 45,
  includes: ["4 dumpling soups"],
  featured: true,
};

const sauce: Extra = { _id: "extra_sauce", name: "Secret sauce", price: 1 };
const soup: Extra = { _id: "extra_soup", name: "Dumpling soup", price: 1 };
const extras = [sauce, soup];

const fullCart: CartState = {
  tier,
  extras: { [sauce._id]: 2 },
};

// The crux of WP-8 (spec §12): the wire payload must carry ONLY menuItemId + quantity.
describe("cart payload (spec §12 — no price ever leaves the browser)", () => {
  it("emits only { menuItemId, quantity } per line — never a price/amount/total", () => {
    const lines = toCartLines(fullCart);

    for (const line of lines) {
      expect(Object.keys(line).sort()).toEqual(["menuItemId", "quantity"]);
      // Hard assert: no pricing field by any common name.
      expect(line).not.toHaveProperty("price");
      expect(line).not.toHaveProperty("unitPrice");
      expect(line).not.toHaveProperty("amount");
      expect(line).not.toHaveProperty("total");
      expect(line).not.toHaveProperty("lineTotal");
    }
  });

  it("uses the Sanity _id of priced docs (tier + extras) as menuItemId", () => {
    const lines = toCartLines(fullCart);
    expect(lines).toEqual([
      { menuItemId: "tier_60", quantity: 1 },
      { menuItemId: "extra_sauce", quantity: 2 },
    ]);
  });

  it("full create-order payload contains only customerEmail + price-free items", () => {
    const payload = toOrderPayload(fullCart, "guest@example.com");

    expect(Object.keys(payload).sort()).toEqual(["customerEmail", "items"]);
    expect(payload.customerEmail).toBe("guest@example.com");
    // Stringify the whole payload and assert no price-ish token leaks through.
    const serialized = JSON.stringify(payload).toLowerCase();
    expect(serialized).not.toContain("price");
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain("total");
    expect(serialized).not.toContain("45"); // the tier's dollar price must not appear
  });

  it("omits extras with zero quantity", () => {
    const cart: CartState = { tier, extras: { [sauce._id]: 0 } };
    expect(toCartLines(cart)).toEqual([{ menuItemId: "tier_60", quantity: 1 }]);
  });

  it("computes a DISPLAY-only subtotal (server remains authoritative)", () => {
    expect(cartSubtotal(fullCart, extras)).toBe(47); // 45 + 2×1
    expect(cartSubtotal(emptyCart, extras)).toBe(0);
  });

  it("requires a tier before the cart can be submitted", () => {
    expect(isCartSubmittable(emptyCart)).toBe(false);
    expect(isCartSubmittable(fullCart)).toBe(true);
  });
});
