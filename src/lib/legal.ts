/**
 * Shared facts used across the static policy pages so contact details, the trading name,
 * and the "last updated" date stay consistent in one place. Update here when they change.
 */
export const LEGAL = {
  businessName: "My Wife's Dumplings",
  location: "Auckland, New Zealand",
  contactEmail: "mywifesdumplingsofficial@gmail.com",
  /** Pickup is arranged by message after ordering — there is no fixed storefront. */
  pickupSummary:
    "We are a handmade dumpling business based in Auckland. Orders are made fresh and " +
    "collected by pickup, which we arrange with you by message after you order.",
  /** Order roughly a day ahead — order by the evening before for next-day pickup. */
  leadTime: "next-day (please order by the evening before)",
  lastUpdated: "20 June 2026",
} as const;
