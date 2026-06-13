import { sanityClient } from "./client";
import { MenuItem, PricingTier, Extra, GalleryImage, SiteSettings } from "@/types";

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
    }`
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
    }`
  );
}

export async function getExtras(): Promise<Extra[]> {
  return sanityClient.fetch(
    `*[_type == "extra"] | order(name asc) {
      _id,
      name,
      price
    }`
  );
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  return sanityClient.fetch(
    `*[_type == "galleryImage"] | order(order asc) {
      _id,
      image,
      alt,
      caption
    }`
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
    }`
  );
}
