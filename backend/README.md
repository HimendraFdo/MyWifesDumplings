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

## Next work packages

WP-2 (data model & migrations) → WP-3 (auth) ∥ WP-4 (orders core) → WP-5 (Stripe webhook) →
WP-6 (admin/status) → WP-7 (deploy) → WP-8 (frontend) → WP-9 (SignalR, optional).
