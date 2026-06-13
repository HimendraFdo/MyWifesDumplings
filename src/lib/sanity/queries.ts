import { sanityClient } from "./client";
import { MenuItem, PricingTier, Extra, GalleryImage, SiteSettings } from "@/types";

// Pages regenerate at most every 60s as a safety net, and instantly when the
// Sanity webhook hits /api/revalidate with the matching document _type tag.
const REVALIDATE_SECONDS = 60;

export async function getMenuItems(): Promise<MenuItem[]> {
  return sanityClient.fetch(
    `*[_type == "menuItem" && available == true] | order(order asc) {
      _id,
      name,
      slug,
      tagline,
      description,
      image,
      available
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS, tags: ["menuItem"] } }
  );
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  return sanityClient.fetch(
    `*[_type == "pricingTier"] | order(quantity asc) {
      _id,
      quantity,
      price,
      includes,
      featured
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS, tags: ["pricingTier"] } }
  );
}

export async function getExtras(): Promise<Extra[]> {
  return sanityClient.fetch(
    `*[_type == "extra"] | order(name asc) {
      _id,
      name,
      price
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS, tags: ["extra"] } }
  );
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  return sanityClient.fetch(
    `*[_type == "galleryImage"] | order(order asc) {
      _id,
      image,
      alt,
      caption
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS, tags: ["galleryImage"] } }
  );
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch(
    `*[_type == "siteSettings"][0] {
      heroHeading,
      heroSubheading,
      aboutText,
      orderFormUrl,
      instagramUrl,
      heroImage
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS, tags: ["siteSettings"] } }
  );
}
