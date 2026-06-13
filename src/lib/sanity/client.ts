import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  // Disabled so Next.js owns caching/revalidation (ISR + tag-based webhook
  // revalidation). With useCdn:true the Sanity CDN could serve stale data.
  useCdn: false,
});
