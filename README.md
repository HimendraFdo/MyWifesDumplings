# My Wife's Dumplings

A full-stack website and online ordering platform for a handmade dumpling business in Auckland, New Zealand.

**Frontend:** <https://my-wifes-dumplings.vercel.app>

**Sanity Studio:** <https://mywifesdumplings.sanity.studio>

## What the application does

- Marketing pages with menu, pricing, gallery, about, and contact content from Sanity
- Guest and customer checkout using Stripe Elements and PaymentIntents
- Server-side menu pricing so the browser never controls order totals
- Customer registration, JWT login, and account order history
- Secure guest order lookup links
- Admin order dashboard with payment state, filtering, and fulfilment status updates
- Stripe webhook verification as the source of truth for successful payments
- Enquiry and order confirmation emails through Resend
- Responsive UI, reduced-motion support, Open Graph metadata, analytics, and speed insights

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Base UI, Framer Motion, Lucide |
| Forms and validation | React Hook Form, Zod |
| Content | Sanity CMS and Sanity Studio |
| Payments | Stripe Elements, Stripe PaymentIntents, Stripe webhooks |
| Backend | ASP.NET Core 8 Minimal APIs |
| Authentication | ASP.NET Core Identity, JWT bearer authentication, role-based authorization |
| Data | Entity Framework Core 8, SQL Server / Azure SQL |
| Email | Resend |
| Observability | Application Insights, Vercel Analytics, Vercel Speed Insights |
| Testing | Vitest, Testing Library, xUnit |
| Deployment | Vercel frontend; Azure App Service backend; Azure Key Vault for production secrets |

## Repository structure

```text
src/
  app/                 Next.js routes, layouts, server actions, and route handlers
  components/          Marketing, ordering, authentication, admin, and UI components
  lib/                 API client, auth, cart, Stripe, Sanity, and validation utilities
  test/                Frontend unit tests
backend/
  src/MyWifesDumplings.Api/
                       ASP.NET Core API, EF Core data layer, auth, orders, and payments
  tests/               Backend xUnit tests
  docs/                Backend deployment and Stripe webhook runbooks
studio/                Sanity Studio and content schemas
docs/                  Architecture and end-to-end specifications
```

## Local development

### Prerequisites

- Node.js and npm
- .NET 8 SDK
- SQL Server or another SQL Server-compatible local database
- A Sanity project
- Stripe test keys for checkout and payment testing
- Optional: Stripe CLI for local webhook forwarding

### 1. Frontend

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend runs at <http://localhost:3000>.

Set these values in `.env.local`:

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset, normally `production` |
| `SANITY_API_TOKEN` | For private datasets | Server-side Sanity access |
| `SANITY_REVALIDATE_SECRET` | For webhooks | Shared secret for Sanity content revalidation |
| `RESEND_API_KEY` | For enquiries | Sends contact/enquiry email |
| `NEXT_PUBLIC_API_BASE_URL` | For ordering | ASP.NET Core API URL; locally `http://localhost:5198` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For checkout | Stripe publishable test or live key |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL used by metadata |
| `NEXT_PUBLIC_ORDER_FORM_URL` | Optional | External order-form fallback URL |

Never place a Stripe secret key in a `NEXT_PUBLIC_*` variable.

### 2. Backend API

Configure local secrets from the API project:

```powershell
Set-Location backend/src/MyWifesDumplings.Api
dotnet user-secrets set "ConnectionStrings:Default" "<local-sql-server-connection-string>"
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."
dotnet run --launch-profile http
```

The API runs at <http://localhost:5198>, with Swagger at
<http://localhost:5198/swagger> and health status at
<http://localhost:5198/health>.

In Development:

- A stub menu price provider is used when `Sanity:ProjectId` and `Sanity:Dataset` are not configured.
- Order email delivery is disabled when `Resend:ApiKey` is not configured.
- The development configuration seeds `admin@example.com`; replace the placeholder password through user-secrets if needed.
- EF Core applies pending migrations and seeds the `Customer` and `Admin` roles at startup.

Additional backend settings use ASP.NET Core configuration keys:

| Setting | Purpose |
|---|---|
| `ConnectionStrings:Default` | SQL Server / Azure SQL connection string |
| `Sanity:ProjectId`, `Sanity:Dataset`, `Sanity:Token` | Server-side menu and pricing source |
| `Stripe:SecretKey`, `Stripe:WebhookSecret` | PaymentIntent creation and webhook verification |
| `Resend:ApiKey`, `Resend:FromAddress`, `Resend:LookupBaseUrl` | Order confirmation email |
| `Jwt:SigningKey` | JWT signing secret |
| `Seed:AdminEmail`, `Seed:AdminPassword` | Initial admin account |
| `Cors:AllowedOrigins` | Permitted frontend origins |
| `ApplicationInsights:ConnectionString` | Backend telemetry |

For complete local payment testing, see
[`backend/docs/stripe-webhook-testing.md`](backend/docs/stripe-webhook-testing.md).

### 3. Sanity Studio

```powershell
Set-Location studio
npm install
npm run dev
```

The Studio runs at <http://localhost:3333>.

## Common commands

Run frontend commands from the repository root:

```powershell
npm run dev
npm run build
npm run lint
npm test
npm run test:coverage
```

Run backend commands from `backend/`:

```powershell
dotnet restore
dotnet build
dotnet test
```

## Deployment

- The Next.js frontend is deployed to Vercel.
- The Sanity Studio is deployed through Sanity.
- The backend CI workflow builds and tests the .NET API on changes under `backend/`.
- Azure deployment is opt-in through `AZURE_DEPLOY_ENABLED=true`.
- The production API targets Azure App Service and Azure SQL.
- Production secrets are loaded from Azure Key Vault using the App Service managed identity.
- Database migrations are applied at API startup when a connection string is configured.

Before enabling backend deployment, configure the Azure resources, GitHub OIDC values, Key Vault
secrets, production CORS origin, Stripe webhook, and Vercel frontend variables. See
[`backend/docs/deployment.md`](backend/docs/deployment.md) for the complete runbook.
