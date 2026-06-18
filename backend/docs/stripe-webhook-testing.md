# Testing the Stripe payment flow locally

How to exercise the **real** Stripe payment path end-to-end against **test mode** — order
creation, the signature-verified webhook, and both decline and success outcomes — using the
Stripe CLI. This is the manual counterpart to the unit tests in
[`StripeWebhookServiceTests.cs`](../tests/MyWifesDumplings.Api.Tests/StripeWebhookServiceTests.cs).

Relevant wiring:

| Thing | Value |
|---|---|
| Webhook route | `POST /api/webhooks/stripe` ([`WebhookEndpoints.cs`](../src/MyWifesDumplings.Api/Endpoints/WebhookEndpoints.cs)) |
| Dev API URL | `http://localhost:5198` (http profile) |
| Webhook secret config key | `Stripe:WebhookSecret` (user-secrets) |
| Secret key config key | `Stripe:SecretKey` (user-secrets, `sk_test_…`) |
| Single source of payment truth | `payment_intent.succeeded` → [`StripeWebhookService`](../src/MyWifesDumplings.Api/Payments/StripeWebhookService.cs) |

> The webhook is the **only** code path that marks an order paid. A decline never marks an
> order paid because Stripe sends `payment_intent.payment_failed`, which the service
> acknowledges (HTTP 200) but ignores.

## Prerequisites

- **Stripe CLI.** Installed via `winget install Stripe.StripeCLI`. If `stripe` isn't found,
  the folder may not be on PATH yet — open a **new** terminal (winget adds it on install).
- **Logged in:** `stripe login`, authorizing **test mode** of the correct account.
- **Sanity not required.** With Sanity unconfigured in Development, the app uses
  [`StubMenuPriceProvider`](../src/MyWifesDumplings.Api/Pricing/StubMenuPriceProvider.cs).
  Valid dev menu ids: `dev-pork-dumplings` ($12.50), `dev-veggie-dumplings` ($11.00),
  `dev-chicken-bao` ($9.75). Any other id is rejected exactly like a real unknown id.

## ⚠️ Account / profile gotcha (read this first)

`stripe login` can leave you with **multiple profiles** — e.g. a `default` that points at a
**sandbox** account and a named profile for the real account. Your backend's `sk_test` key
and the CLI **must operate on the same account**, or PaymentIntents created by the backend
will be invisible to the CLI ("No such payment_intent") and forwarded webhooks will never
match an order.

Check which account each profile uses:

```powershell
stripe config --list
```

Make the real account the default so plain `stripe listen` / `stripe trigger` hit it:

```powershell
stripe config --set default-project-name "<your account profile name>"
```

A profile may also hold a **live** key (`rk_live_…`). Keep this whole procedure in **test
mode** and never run write commands against a live profile.

## One-time per session: wire the webhook secret

The Stripe CLI mints a **fresh** `whsec_…` every time you start `stripe listen`. The API must
trust that exact secret, so this is a per-session step.

**Terminal 1 — start the listener** (leave running):

```powershell
stripe listen --forward-to localhost:5198/api/webhooks/stripe
# > Ready! Your webhook signing secret is whsec_abc123...
```

**Terminal 2 — point the API at that secret, then run it:**

```powershell
cd backend/src/MyWifesDumplings.Api
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_abc123..."
dotnet user-secrets list      # confirm Stripe:SecretKey (sk_test_...) is also present
dotnet run                    # wait for: Now listening on: http://localhost:5198
```

> The production webhook signing secret (from the Dashboard) is **separate and stable** — that
> one is for deploy (WP-7), not these local sessions.

## Scenario A — declined card stays unpaid

Create an order (**Terminal 3**):

```powershell
curl -X POST http://localhost:5198/api/orders `
  -H "Content-Type: application/json" `
  -d '{ "customerEmail": "guest@example.com", "items": [ { "menuItemId": "dev-pork-dumplings", "quantity": 2 } ] }'
# -> { "orderId": N, "clientSecret": "pi_XXX_secret_..." }
```

The PaymentIntent id is the part of `clientSecret` before `_secret_`. Confirm it with a
decline test payment method:

```powershell
stripe payment_intents confirm pi_XXX `
  --payment-method pm_card_chargeDeclined `
  --return-url https://example.com
```

Expected: `card_declined` / `generic_decline`, `amount_received: 0`. The order stays
**unpaid** (`isPaid: false`, `paidAt: null`).

## Scenario B — successful card marks the order paid (via the webhook)

Create another order, then confirm with a **success** payment method:

```powershell
stripe payment_intents confirm pi_YYY `
  --payment-method pm_card_visa `
  --return-url https://example.com
```

This fires `payment_intent.succeeded` → `stripe listen` forwards it → the endpoint verifies
the signature → the order flips to **paid** within a few seconds. The `stripe listen` terminal
shows `payment_intent.succeeded → [200]`.

## Verify order state

Log in as the seeded dev admin and list orders:

```powershell
# Get a token (dev admin from appsettings.Development.json Seed section)
$token = (curl -s -X POST http://localhost:5198/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{ "email": "admin@example.com", "password": "<dev admin password>" }' `
  | ConvertFrom-Json).accessToken

curl http://localhost:5198/api/admin/orders -H "Authorization: Bearer $token"
```

Look for `isPaid` / `paidAt`: declined orders stay `false` / `null`; succeeded orders show
`true` with a timestamp.

## Other test payment methods

| Payment method | Result |
|---|---|
| `pm_card_visa` | success |
| `pm_card_chargeDeclined` | generic decline |
| `pm_card_chargeDeclinedInsufficientFunds` | insufficient funds |
| `pm_card_chargeDeclinedLostCard` | lost card |
| `pm_card_visa_chargeDeclinedExpiredCard` | expired card |

Full reference: <https://docs.stripe.com/testing>

## Quick plumbing-only check

To confirm just the CLI → endpoint → signature path without a matching order:

```powershell
stripe trigger payment_intent.payment_failed
```

The service logs that it ignored the event and returns 200. (No order matches the throwaway
PaymentIntent, so this does **not** exercise order state — use Scenarios A/B for that.)
