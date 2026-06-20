/**
 * Shared facts used across the static policy pages so contact details, the trading name,
 * and the "last updated" date stay consistent in one place. Update here when they change.
 */
export const LEGAL = {
  businessName: "My Wife's Dumplings",
  location: "Auckland, New Zealand",
  contactEmail: "mywifesdumplingsofficial@gmail.com",
  /** Contact phone for arranging pickup/delivery. */
  phone: "022 078 5540",
  /** Pickup address (the kitchen). */
  pickupAddress: "70 Great South Road, Epsom, Auckland",
  /** We now offer both pickup (from the kitchen) and delivery across Auckland. */
  pickupSummary:
    "We are a handmade dumpling business based in Auckland. Orders are made fresh and either " +
    "collected by pickup from 70 Great South Road, Epsom, or delivered across Auckland — your " +
    "choice at checkout.",
  /** Order roughly a day ahead — pre-order only, by the evening before. */
  leadTime: "next-day (pre-order only — please order by the evening before)",
  lastUpdated: "20 June 2026",
} as const;
