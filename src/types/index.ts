import type { SanityImageSource } from "@sanity/image-url";
import { PortableTextBlock } from "@portabletext/types";

export interface MenuItem {
  _id: string;
  name: string;
  slug: { current: string };
  tagline: string;
  description?: string;
  image?: SanityImageSource;
  available: boolean;
}

export interface PricingTier {
  _id: string;
  quantity: number;
  price: number;
  includes: string[];
  featured: boolean;
}

export interface Extra {
  _id: string;
  name: string;
  price: number;
}

export interface GalleryImage {
  _id: string;
  image: SanityImageSource;
  alt: string;
  caption?: string;
}

export interface SiteSettings {
  heroHeading: string;
  heroSubheading?: string;
  aboutText?: PortableTextBlock[];
  orderFormUrl?: string;
  instagramUrl?: string;
  heroImage?: SanityImageSource;
}
