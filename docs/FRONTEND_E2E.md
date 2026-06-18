# WP-8 — Frontend Integration: Manual E2E & Setup

This document covers the frontend ordering/auth/admin integration (spec §9/§10 WP-8) and the
**manual** end-to-end acceptance steps. Full automated E2E is **deferred** — it needs a running
.NET backend + Azure SQL + Stripe **test** keys, none of which are available in the CI/build
environment. The flow is wired correctly; the steps below verify it against a live backend.

## Environment variables (a human must supply these)

Frontend (`.env.local` / Vercel project env). Placeholders are in `.env.example`:

| Var | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` (dev) / `https://<app>.azurewebsites.net` (prod) | Base URL of the .NET API, **no trailing slash**. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Stripe **publishable** key. Browser-safe, **not** secret. |

> **Never** put a Stripe **secret** key (`sk_...`) or webhook signing secret in this repo or in any
> `NEXT_PUBLIC_*` var. Those live only in the backend / Azure Key Vault (spec §5/§12).

Backend must allow the frontend origin via CORS (`Cors:AllowedOrigins`) and have its own
Stripe **secret** key + webhook secret, Sanity config, and a seeded `Admin` user.

## Routes added

| Route | Purpose | Auth |
|---|---|---|
| `/order` | Cart (tier + extras) → create order → Stripe payment | Public (guest + customer) |
| `/order/lookup/[token]` | Resolve an emailed guest order link | Public (token) |
| `/login`, `/register` | Auth UI; stores JWT | Public |
| `/account/orders` | "My Orders" history | Customer (JWT) |
| `/admin` | Order dashboard + status transitions, polls every 12s | Admin JWT only |

## Manual E2E — guest order happy path (spec §10 acceptance)

Prereqs: backend running and reachable at `NEXT_PUBLIC_API_BASE_URL`, Stripe in **test mode**,
backend webhook receiving events (e.g. `stripe listen --forward-to <api>/api/webhooks/stripe`),
an `Admin` user seeded.

1. `npm run dev` with both env vars set. Open `/order`.
2. Pick a dumpling pack, optionally add extras, enter an email, click **Continue to payment**.
   - The browser calls `POST /api/orders` with `{ customerEmail, items: [{ menuItemId, quantity }] }`
     — **no price** in the request (verify in DevTools → Network). It receives `{ orderId, clientSecret }`.
3. The Stripe Payment Element mounts with the `clientSecret`. Enter test card `4242 4242 4242 4242`,
   any future expiry, any CVC/ZIP. Card data goes **browser → Stripe directly** (spec §5).
4. Click **Pay**. On confirmation the UI shows a **pending/thank-you** state — it does **not** claim
   the order is paid; payment is finalized by the backend webhook (spec §5).
5. Stripe fires `payment_intent.succeeded` → backend webhook marks the order **Paid**, status
   `NotStarted`, and sends the Resend confirmation email (WP-5).
6. Open the emailed guest link (`/order/lookup/<token>`) → the order shows as **Paid / Not started**.

## Manual E2E — admin moves the order to Completed

1. Log in at `/login` with the seeded **Admin** account → redirected to `/admin`.
2. The new paid order appears (dashboard polls every ~12s; refresh to force).
3. Click **Mark Ongoing**, then **Mark Completed** (`PATCH /api/orders/{id}/status` with the
   numeric enum value). The card updates in place.
4. Non-admin/anonymous users hitting `/admin` are redirected to `/login` (anon) or shown an
   "Admins only" block (logged-in non-admin). A `401/403` from the API logs the user out / blocks.

## Account path parity (spec §4)

Repeat the order flow while logged in as a Customer: identical UI/steps, except the order is
stamped to the account and appears under `/account/orders`. Guest checkout has **no** degradation.

## Declined-card check (Stripe test)

Use card `4000 0000 0000 0002` → the Payment Element shows the decline inline; no order is marked
paid. (Other test cards: see the `stripe:test-cards` reference.)

## Card decline / secret-free build

`npm run build` and `npm run dev` succeed **without** real Stripe/backend secrets present. With
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` unset, `/order` renders and blocks at "payments not configured"
instead of crashing. With `NEXT_PUBLIC_API_BASE_URL` unset, API calls surface a clear error.
