# Agent 7 — Deployment & Analytics (Vercel + Vercel Analytics)

## Your role
You are the deployment agent. Your job is to deploy the site to Vercel, configure all environment variables, set up Vercel Analytics, connect the Sanity Studio to Vercel, and make the site production-ready. You will also add an `og-image`, verify the build, and update `README.md` with project documentation.

---

## Why this adds CV value

- **Vercel deployment from CLI** — standard for Next.js projects in NZ
- **Vercel Analytics** — lightweight, privacy-first, no cookie consent needed (important in NZ/AU)
- **Environment variable management** — demonstrates production deployment awareness
- **Custom domain considerations** — shows professional delivery mindset

---

## Prerequisites

- Agent 6 has completed all animations
- `npm run build` passes with no errors locally
- You have a GitHub account and the project is pushed to a GitHub repo
- You have a Vercel account (free tier is fine)

---

## Step 1 — Verify local build is clean

```bash
npm run build
```

Fix any TypeScript errors or missing `alt` props before proceeding. The build must be green.

Also run:
```bash
npx vitest run
```

All tests should pass.

---

## Step 2 — Push to GitHub

If not already on GitHub:

```bash
git add .
git commit -m "feat: My Wife's Dumplings website — full stack Next.js with Sanity, Framer Motion, Resend"
git branch -M main
git remote add origin https://github.com/HimendraFdo/my-wifes-dumplings.git
git push -u origin main
```

> Create the `my-wifes-dumplings` repo on GitHub first (github.com/new). Make it **public** so it shows on your CV.

---

## Step 3 — Deploy to Vercel via CLI

Install Vercel CLI if not already installed:
```bash
npm i -g vercel
```

From the project root:
```bash
vercel
```

When prompted:
- Link to existing project? **No** (first deploy)
- Project name: `my-wifes-dumplings`
- Root directory: `.` (current)
- Build command: `npm run build` (default)
- Output directory: `.next` (default)
- Override dev command? **No**

After first deploy completes, link to GitHub for auto-deploys:
```bash
vercel link
```

Then push future changes and Vercel auto-deploys on every `git push`.

---

## Step 4 — Set environment variables in Vercel

Run for each variable:
```bash
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production
vercel env add NEXT_PUBLIC_SANITY_DATASET production
vercel env add SANITY_API_TOKEN production
vercel env add RESEND_API_KEY production
vercel env add NEXT_PUBLIC_ORDER_FORM_URL production
```

Or set them via the Vercel dashboard:
`vercel.com → Project → Settings → Environment Variables`

Add all 5 keys from `.env.local` using the "Production" scope.

After adding env vars, redeploy:
```bash
vercel --prod
```

---

## Step 5 — Verify Vercel Analytics is working

`@vercel/analytics` was installed in Agent 1 and `<Analytics />` was added to `layout.tsx`. No extra config needed.

To confirm it's active:
1. Visit your deployed Vercel URL
2. Go to Vercel Dashboard → your project → Analytics tab
3. You should see a "real-time" viewer count after a page visit

If the Analytics tab isn't available, enable it in Vercel Dashboard → your project → Analytics → Enable.

---

## Step 6 — Open Graph image

Create a simple OG image for social sharing. Place a `1200x630` image at `public/og-image.jpg`.

If you don't have a custom image yet, create a placeholder using Next.js metadata image generation. Create `src/app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5E6D3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          border: "8px solid #C0392B",
        }}
      >
        <div style={{ fontSize: 80, color: "#C0392B" }}>🥟</div>
        <div
          style={{
            fontSize: 72,
            fontStyle: "italic",
            color: "#1A0A00",
            fontFamily: "serif",
          }}
        >
          My Wife&apos;s Dumplings
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#1A0A00",
            opacity: 0.6,
            fontFamily: "sans-serif",
          }}
        >
          Handmade with love. Auckland, NZ.
        </div>
      </div>
    ),
    { ...size }
  );
}
```

Update `src/app/layout.tsx` metadata to use the generated image:

```ts
export const metadata: Metadata = {
  // ... existing ...
  openGraph: {
    title: "My Wife's Dumplings",
    description: "Handmade dumplings made with love in Auckland, NZ.",
    url: "https://mywifesdumplings.vercel.app",
    siteName: "My Wife's Dumplings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Wife's Dumplings",
    description: "Handmade dumplings made with love in Auckland, NZ.",
  },
};
```

---

## Step 7 — Deploy Sanity Studio to Vercel (optional but recommended)

This gives the business owner a live URL to manage content from:

```bash
cd studio
npx sanity deploy
```

When prompted, choose a unique studio hostname: `mywifesdumplings`

The studio will be available at: `https://mywifesdumplings.sanity.studio`

Send this URL to the business owner so she can update her menu and gallery images herself.

---

## Step 8 — Configure Sanity CORS for production

In Sanity Management (sanity.io/manage):
1. Open your project
2. Go to API → CORS Origins
3. Add your Vercel production URL: `https://mywifesdumplings.vercel.app`
4. Allow credentials: **Yes** (needed for Studio access)

---

## Step 9 — Performance audit

Run Lighthouse on the deployed URL:

```bash
npx lighthouse https://mywifesdumplings.vercel.app --output=html --output-path=./lighthouse-report.html
```

Or use Chrome DevTools → Lighthouse tab.

**Target scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

Common fixes if scores are low:
- Add `sizes` prop to all `<Image>` components
- Ensure all images have `alt` text
- Add `lang="en"` to `<html>` (already done)
- Check colour contrast ratios (brand red on cream should be checked)

---

## Step 10 — Update README.md

Update the project `README.md` to document the project (this is what employers see when they visit your GitHub):

```md
# My Wife's Dumplings

A full-stack business website for a handmade dumpling business in Auckland, NZ.

**Live site:** https://mywifesdumplings.vercel.app  
**CMS Studio:** https://mywifesdumplings.sanity.studio

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS + Shadcn/ui |
| Animations | Framer Motion |
| CMS | Sanity (headless, with live Studio) |
| Forms | React Hook Form + Zod |
| Email | Resend (transactional) |
| Analytics | Vercel Analytics |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |

## Features

- Dynamic menu and pricing managed via Sanity CMS
- Enquiry form with client-side validation (Zod) and email notifications (Resend)
- Smooth scroll animations with Framer Motion
- Fully responsive (mobile-first)
- Server Components for all data fetching (Next.js App Router)
- Open Graph metadata for social sharing
- Sub-1s LCP on Vercel Edge Network

## Local Development

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in keys
4. `npm run dev` — Next.js on localhost:3000
5. `cd studio && npx sanity dev` — Sanity Studio on localhost:3333

## Project Structure

\`\`\`
src/
  app/           Next.js App Router pages + API
  components/
    brand/       Custom brand components (MenuCard, PricingCard, etc.)
    layout/      Header, Footer
    sections/    Page sections (Hero, Menu, Pricing, About, Gallery, Contact)
    ui/          Shadcn/ui primitives
  lib/
    sanity/      Sanity client, queries, image helper
    validations  Zod schemas
  types/         Shared TypeScript types
studio/          Sanity Studio project
\`\`\`
```

---

## Final production checklist

- [ ] `npm run build` passes with no errors
- [ ] `npx vitest run` — all tests pass
- [ ] Deployed to Vercel and live URL works
- [ ] All 5 environment variables set in Vercel production
- [ ] Sanity Studio deployed and accessible
- [ ] CORS configured for production domain
- [ ] OG image renders correctly (test at opengraph.xyz)
- [ ] Contact form sends email (test on live URL)
- [ ] Google Analytics / Vercel Analytics receiving events
- [ ] Lighthouse score 90+ Performance
- [ ] README updated on GitHub
- [ ] GitHub repo is public (visible on CV)

---

## Adding to your CV

Under Projects, add:

**My Wife's Dumplings — Full-Stack Business Website** | Next.js, Sanity, Framer Motion, Resend, Vercel

- Built a production business website for a local Auckland food business using Next.js 14 App Router with server components, TypeScript, and Tailwind CSS.
- Integrated Sanity CMS so the business owner can update menu items, pricing, and gallery images without touching code.
- Implemented an enquiry form with client-side validation (React Hook Form + Zod) and transactional email notifications (Resend).
- Animated the UI with Framer Motion (stamp entrances, scroll-triggered reveals, hover micro-interactions) and deployed to Vercel with analytics.
