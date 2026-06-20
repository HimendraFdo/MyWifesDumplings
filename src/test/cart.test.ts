import { describe, it, expect } from "vitest";
import {
  cartSubtotal,
  estimateDeliveryFee,
  isCartSubmittable,
  toCartLines,
  toOrderPayload,
  emptyCart,
  emptyFulfilment,
  type CartState,
  type Fulfilment,
} from "@/lib/cart";
import type { PricingTier, Extra } from "@/types";

const tier: PricingTier = {
  _id: "tier_60",
  quantity: 60,
  price: 45,
  includes: ["4 dumpling soups"],
  featured: true,
};

const tier20: PricingTier = {
  _id: "tier_20",
  quantity: 20,
  price: 16,
  includes: ["2 dumpling soups"],
  featured: false,
};

const sauce: Extra = { _id: "extra_sauce", name: "Secret sauce", price: 1 };
const soup: Extra = { _id: "extra_soup", name: "Dumpling soup", price: 1 };
const extras = [sauce, soup];

// A pickup customer with the always-required contact details filled in.
const pickupFulfilment: Fulfilment = {
  ...emptyFulfilment,
  method: "Pickup",
  name: "Jane",
  phone: "0210000000",
};

const fullCart: CartState = {
  tier,
  extras: { [sauce._id]: 2 },
  flavour: "Pork n Chives",
  fulfilment: pickupFulfilment,
};

// The crux of WP-8 (spec §12): the wire payload must carry ONLY menuItemId + quantity.
describe("cart payload (spec §12 — no price ever leaves the browser)", () => {
  it("emits only { menuItemId, quantity } per line — never a price/amount/total", () => {
    const lines = toCartLines(fullCart);

    for (const line of lines) {
      expect(Object.keys(line).sort()).toEqual(["menuItemId", "quantity"]);
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

  it("never leaks a price/amount/fee token in the full payload", () => {
    const cart: CartState = {
      tier: tier20,
      extras: {},
      flavour: "Pork n Chives",
      fulfilment: {
        ...emptyFulfilment,
        method: "Delivery",
        zone: "AucklandCentral",
        name: "Jane",
        phone: "0210000000",
        address: "1 Queen St",
        postcode: "1010",
      },
    };
    const payload = toOrderPayload(cart, "guest@example.com");

    // The fee is NEVER sent — only the zone enum value. The server computes the fee (§12).
    expect(payload).not.toHaveProperty("deliveryFee");
    expect(payload).not.toHaveProperty("total");
    expect(payload).not.toHaveProperty("amount");
    const serialized = JSON.stringify(payload).toLowerCase();
    expect(serialized).not.toContain("price");
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain('"total"');
    expect(serialized).not.toContain("16"); // the tier's dollar price must not appear
  });

  it("omits extras with zero quantity", () => {
    const cart: CartState = {
      tier,
      extras: { [sauce._id]: 0 },
      flavour: "Pork n Chives",
      fulfilment: pickupFulfilment,
    };
    expect(toCartLines(cart)).toEqual([{ menuItemId: "tier_60", quantity: 1 }]);
  });

  it("computes a DISPLAY-only items subtotal (server remains authoritative)", () => {
    expect(cartSubtotal(fullCart, extras)).toBe(47); // 45 + 2×1
    expect(cartSubtotal(emptyCart, extras)).toBe(0);
  });
});

describe("fulfilment + delivery fee (mirrors server rules; server is authoritative)", () => {
  function deliveryCart(zone: Fulfilment["zone"], t: PricingTier): CartState {
    return {
      tier: t,
      extras: {},
      flavour: "Pork n Chives",
      fulfilment: {
        ...emptyFulfilment,
        method: "Delivery",
        zone,
        name: "Jane",
        phone: "0210000000",
        address: "1 Queen St",
        postcode: "1010",
      },
    };
  }

  it("pickup is always free", () => {
    expect(estimateDeliveryFee(fullCart)).toBe(0);
  });

  it("charges the zone fee for a sub-60 delivery order", () => {
    expect(estimateDeliveryFee(deliveryCart("EastSouth", tier20))).toBe(2);
    expect(estimateDeliveryFee(deliveryCart("AucklandCentral", tier20))).toBe(4);
    expect(estimateDeliveryFee(deliveryCart("WestNorth", tier20))).toBe(8);
  });

  it("estimates free delivery for 60+ dumpling orders", () => {
    expect(estimateDeliveryFee(deliveryCart("WestNorth", tier))).toBe(0);
  });

  it("sends the numeric method/zone and delivery fields for delivery", () => {
    const payload = toOrderPayload(deliveryCart("AucklandCentral", tier20), "g@example.com");
    expect(payload.method).toBe(1); // Delivery
    expect(payload.zone).toBe(2); // AucklandCentral
    expect(payload.deliveryAddress).toBe("1 Queen St");
    expect(payload.deliveryPostcode).toBe("1010");
  });

  it("omits delivery-only fields for pickup", () => {
    const payload = toOrderPayload(fullCart, "g@example.com");
    expect(payload.method).toBe(0); // Pickup
    expect(payload).not.toHaveProperty("zone");
    expect(payload).not.toHaveProperty("deliveryAddress");
    expect(payload).not.toHaveProperty("deliveryPostcode");
  });
});

describe("submit gating mirrors backend validation", () => {
  it("requires items, name and phone", () => {
    expect(isCartSubmittable(emptyCart)).toBe(false);
    expect(isCartSubmittable(fullCart)).toBe(true);
    expect(
      isCartSubmittable({ ...fullCart, fulfilment: { ...pickupFulfilment, phone: "" } }),
    ).toBe(false);
  });

  it("requires zone + address + postcode for delivery", () => {
    const base: CartState = {
      tier: tier20,
      extras: {},
      flavour: "Pork n Chives",
      fulfilment: {
        ...emptyFulfilment,
        method: "Delivery",
        name: "Jane",
        phone: "0210000000",
      },
    };
    expect(isCartSubmittable(base)).toBe(false); // no zone/address/postcode
    expect(
      isCartSubmittable({
        ...base,
        fulfilment: {
          ...base.fulfilment,
          zone: "EastSouth",
          address: "1 Queen St",
          postcode: "1010",
        },
      }),
    ).toBe(true);
  });
});
