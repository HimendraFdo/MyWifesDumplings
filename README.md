# My Wife's Dumplings

A full-stack business website for a handmade dumpling business in Auckland, NZ.

**Live site:** https://mywifesdumplings.vercel.app
**CMS Studio:** https://mywifesdumplings.sanity.studio

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| CMS | Sanity (headless, with live Studio) |
| Forms | React Hook Form + Zod |
| Email | Resend (transactional) |
| Analytics | Vercel Analytics + Speed Insights |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |

## Features

- Dynamic menu and pricing managed via Sanity CMS
- Enquiry form with client-side validation (Zod) and email notifications (Resend)
- Smooth scroll animations and micro-interactions with Framer Motion (respects `prefers-reduced-motion`)
- Fully responsive (mobile-first)
- Server Components for all data fetching (Next.js App Router)
- Open Graph metadata with a generated social share image
- Deployed on Vercel's Edge Network

## Local Development

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in keys
4. `npm run dev` — Next.js on localhost:3000
5. `cd studio && npx sanity dev` — Sanity Studio on localhost:3333

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project id (menu/gallery data) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (usually `production`) |
| `SANITY_API_TOKEN` | Sanity read token for server data fetch |
| `RESEND_API_KEY` | Transactional email for the enquiry form |
| `NEXT_PUBLIC_ORDER_FORM_URL` | External order form link |
| `NEXT_PUBLIC_SITE_URL` | _(optional)_ production URL for OG/metadata; defaults to the Vercel domain |

## Project Structure

```
src/
  app/           Next.js App Router pages + API (incl. opengraph-image)
  components/
    brand/       Custom brand components (MenuCard, PricingCard, etc.)
    layout/      Header, Footer
    sections/    Page sections (Hero, Menu, Pricing, About, Gallery, Contact)
    ui/          shadcn/ui primitives
  lib/
    sanity/      Sanity client, queries, image helper
    validations  Zod schemas
  types/         Shared TypeScript types
studio/          Sanity Studio project
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` / `npx vitest run` — test suite

## Deployment

Hosted on Vercel with auto-deploys from the `main` branch. Set all environment
variables above in the Vercel project (Production scope). Vercel Analytics and
Speed Insights are wired into the root layout and activate automatically once
deployed.
