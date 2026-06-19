# My Wife's Dumplings — Backend API

ASP.NET Core 8 (Minimal APIs) backend for online ordering, payments, accounts, and the admin
dashboard. See [`../docs/BACKEND_SPEC.md`](../docs/BACKEND_SPEC.md) for the full architecture and
work-package breakdown.

## Status

**WP-1 — Project scaffold & infra baseline.** Implemented:
- ASP.NET Core 8 Minimal API solution (`MyWifesDumplings.sln`)
- EF Core 8 + Azure SQL wiring (`AppDbContext` — entities land in WP-2)
- Application Insights telemetry
- CORS policy locked to the frontend origin(s)
- `/health` endpoint

## Administration API

The owner administration flow uses JWT `Admin` role authorization:

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login, limited to 5 attempts per IP per minute |
| `GET` | `/api/admin/orders?status=&search=` | Search and filter all orders |
| `PATCH` | `/api/orders/{id}/status` | Apply the next paid-order lifecycle transition |
| `GET` | `/api/admin/orders/{id}/audit` | Read status history oldest first |
| `POST` | `/api/admin/change-password` | Change the signed-in administrator password |

Status changes are forward-only (`NotStarted` to `Ongoing` to `Completed`) and write an
`OrderStatusAudit` record atomically with the order update. Migration
`20260619131503_AddOrderStatusAudits` creates the audit table and index.

## Run locally

```bash
cd src/MyWifesDumplings.Api
dotnet run
```

Then hit `https://localhost:<port>/health` → `{ "status": "ok" }`.
Swagger UI is available in Development at `/swagger`.

## Configuration

| Setting | Where | Notes |
|---|---|---|
| `ConnectionStrings:Default` | Key Vault (prod) / user-secrets (local) | Azure SQL connection string |
| `Cors:AllowedOrigins` | appsettings | Must include the production Vercel domain |
| `ApplicationInsights:ConnectionString` | Key Vault / App Service config | App Insights |

**Never commit real secrets.** Use `dotnet user-secrets` locally and Azure Key Vault in production
(see WP-7 in the spec).

## Testing payments locally

To exercise the Stripe payment flow end-to-end (order → webhook → paid/declined) against test
mode with the Stripe CLI, see [`docs/stripe-webhook-testing.md`](docs/stripe-webhook-testing.md).

## Next work packages

WP-2 (data model & migrations) → WP-3 (auth) ∥ WP-4 (orders core) → WP-5 (Stripe webhook) →
WP-6 (admin/status) → WP-7 (deploy) → WP-8 (frontend) → WP-9 (SignalR, optional).
