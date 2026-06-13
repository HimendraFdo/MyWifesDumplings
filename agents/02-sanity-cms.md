# Agent 2 — Sanity CMS Setup

## Your role
You are the CMS agent. Your job is to set up a Sanity Studio project, define all content schemas, connect Sanity to the Next.js app, and write the data-fetching queries. You are NOT building any UI — just the data layer.

This runs after Agent 1 has scaffolded the project.

---

## Project context

**My Wife's Dumplings** — small Auckland dumpling business. The owner needs to be able to update her menu items, prices, and gallery images without touching code. Sanity gives her a visual CMS editor she can log into from a browser.

Sanity is heavily used by NZ digital agencies (Springload, Ackama, Paper Giant, etc.) — it is a strong CV addition.

---

## Prerequisites

- Agent 1 has completed: Next.js project exists, `next-sanity`, `@sanity/client`, `@sanity/image-url` are already installed.
- You have access to create a free Sanity project at sanity.io.

---

## Step 1 — Create the Sanity Studio project

Inside the existing Next.js project root, create a `studio/` subdirectory and initialise a Sanity project there:

```bash
cd studio
npx sanity@latest init
```

When prompted:
- Create a new project: **Yes**
- Project name: `my-wifes-dumplings`
- Use the default dataset: **Yes** (dataset: `production`)
- Project output path: `.` (current directory — inside `studio/`)
- Template: **Clean project with no predefined schemas**

Copy the **Project ID** from the output. You will need it for `.env.local`.

---

## Step 2 — Define content schemas

Create the following schema files inside `studio/schemaTypes/`:

### `studio/schemaTypes/menuItem.ts`

```ts
import { defineType, defineField } from "sanity";

export const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline (short ingredient list)",
      type: "string",
      description: "e.g. pork mince, chives, fried egg, ginger",
    }),
    defineField({
      name: "description",
      title: "Full description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "tagline", media: "image" },
  },
});
```

### `studio/schemaTypes/pricingTier.ts`

```ts
import { defineType, defineField } from "sanity";

export const pricingTier = defineType({
  name: "pricingTier",
  title: "Pricing Tier",
  type: "document",
  fields: [
    defineField({
      name: "quantity",
      title: "Quantity (pcs)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (NZD)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "includes",
      title: "Includes (extras bundled in)",
      type: "array",
      of: [{ type: "string" }],
      description: "e.g. '2 dumpling soups', 'wife's secret sauce'",
    }),
    defineField({
      name: "featured",
      title: "Featured tier",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
```

### `studio/schemaTypes/extra.ts`

```ts
import { defineType, defineField } from "sanity";

export const extra = defineType({
  name: "extra",
  title: "Extra / Add-on",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (NZD)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
```

### `studio/schemaTypes/galleryImage.ts`

```ts
import { defineType, defineField } from "sanity";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Image",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
});
```

### `studio/schemaTypes/siteSettings.ts`

```ts
import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "heroHeading",
      title: "Hero heading",
      type: "string",
      initialValue: "My Wife's Dumplings",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero subheading",
      type: "string",
    }),
    defineField({
      name: "aboutText",
      title: "About / Story text",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "orderFormUrl",
      title: "Google Form order URL",
      type: "url",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
});
```

### Register all schemas in `studio/schemaTypes/index.ts`

```ts
import { menuItem } from "./menuItem";
import { pricingTier } from "./pricingTier";
import { extra } from "./extra";
import { galleryImage } from "./galleryImage";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [menuItem, pricingTier, extra, galleryImage, siteSettings];
```

---

## Step 3 — Configure the Sanity client in Next.js

Edit `src/lib/sanity/client.ts`:

```ts
import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});
```

Edit `src/lib/sanity/image.ts`:

```ts
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

---

## Step 4 — Write GROQ queries

Edit `src/lib/sanity/queries.ts`:

```ts
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
```

---

## Step 5 — TypeScript types

Edit `src/types/index.ts`:

```ts
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
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
```

Install the PortableText types package:
```bash
npm install @portabletext/types @portabletext/react
```

---

## Step 6 — Seed initial content in Sanity Studio

Start the Sanity Studio locally:
```bash
cd studio && npx sanity dev
```

Open `localhost:3333` and create:

**Menu Items:**
1. Pork n Chives — tagline: "pork mince, chives, fried egg, ginger"
2. Pork n Cabbage — tagline: "pork mince, cabbage, ginger, sesame"

**Pricing Tiers:**
1. 20pcs — $16.00 — includes: ["2 dumpling soups", "wife's secret sauce"]
2. 60pcs — $45.00 — includes: ["4 dumpling soups", "wife's secret sauce"] — featured: true

**Extras:**
1. Wife's secret sauce — $1.00
2. Dumpling soup — $1.00

**Site Settings:**
- heroHeading: "My Wife's Dumplings"
- heroSubheading: "Handmade with love. Auckland, NZ."
- instagramUrl: `https://www.instagram.com/mywifesdumplings`
- orderFormUrl: (the Google Forms link from Instagram bio)

---

## Step 7 — Update `.env.local`

Fill in the Sanity project ID from step 1:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token_here
```

To get the API token: Sanity Dashboard → your project → API → Tokens → Add API token → "Editor" permission.

---

## Verify success

From the Next.js root, run:
```bash
npm run dev
```

In a test file or a temporary page, call one of the query functions and `console.log` the result to confirm Sanity is returning data.

---

## Output for next agent

Agent 3 (Design System & Components) needs:
- `src/types/index.ts` populated
- `src/lib/sanity/` files complete
- `src/lib/sanity/queries.ts` with working queries
- `.env.local` with real Sanity credentials
