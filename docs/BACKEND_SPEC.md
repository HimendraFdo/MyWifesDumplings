# My Wife's Dumplings — Backend Architecture & Build Spec

> **Purpose of this document:** A self-contained brief for a **coordinator agent** to delegate
> backend work to specialized sub-agents. It defines the target architecture, the data model,
> the work packages (with dependencies), and acceptance criteria for each. Read the whole file
> before delegating — the work packages reference shared decisions made in the architecture section.

---

## 0. Git & Branch Workflow (READ FIRST — all agents)

**All agents work on the same branch: `feat/backend-scaffold`.** Do NOT create new branches per
work package and do NOT commit to `main`.

- **Before starting:** `git checkout feat/backend-scaffold && git pull` to get the latest work from
  other agents.
- **Commit small and often** with clear messages, prefixed by the work package, e.g.
  `feat(WP-2): add Order/OrderItem entities + initial migration`.
- **Push after each meaningful unit** so other agents (and dependent work packages) see your changes:
  `git push origin feat/backend-scaffold`.
- **Pull before you push** to integrate others' commits and resolve conflicts locally.
- **Never commit secrets** (Stripe keys, real DB connection strings) — see the guardrails in §12.
- The `backend/.gitignore` already excludes `bin/`, `obj/`, and local secret files — keep it that way.
- The coordinator merges `feat/backend-scaffold` → `main` (via PR) only once a coherent slice is done
  and green. Individual agents do not merge to `main`.

> Rationale: the work packages are tightly coupled (shared DbContext, shared data model, shared API
> project). A single shared branch keeps everyone integrated continuously and avoids a pile of
> conflicting per-package branches. Sequence work per §11 so dependencies land before dependents.

---

## 1. Context

**Existing system (do not rebuild):**
- **Frontend:** Next.js 14 (App Router), deployed on **Vercel**. Stays on Vercel.
- **CMS:** **Sanity** — source of truth for menu, gallery, and marketing content. Stays as-is.
- **Email:** **Resend** already integrated (`src/app/api/contact/route.ts`).
- The frontend has an `order` page (`src/app/(marketing)/order/page.tsx`) but **no transactional backend yet**.

**What we are building:** A **net-new C#/.NET backend on Azure** for online ordering, payments,
user accounts, and an admin dashboard. It sits *alongside* the existing frontend, not replacing it.

**Division of responsibility (keep this clean):**
- **Sanity** → menu / marketing content (display only).
- **.NET API + Azure SQL** → transactional state: orders, customers, payment status.
- Do **NOT** migrate menu content into SQL. The frontend reads the menu from Sanity; at order
  time it sends item IDs/quantities to the API, which **re-validates prices server-side**.

---

## 2. Target Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **ASP.NET Core 8 (LTS) Minimal APIs** | LTS supported to Nov 2026. Monolith-first. |
| Hosting | **Azure App Service (Linux, B1/S1)** | Always-warm. **No Docker, no Kubernetes.** |
| Database | **Azure SQL Database (Serverless tier)** | Auto-pauses when idle. |
| ORM | **Entity Framework Core 8** | Code-first migrations. |
| Payments | **Stripe** (`Stripe.net`) | Server-computed totals; webhook is source of truth. |
| Auth | **ASP.NET Core Identity + JWT** | Users + roles in the same Azure SQL DB. |
| Email | **Resend** (keep) or Azure Communication Services | Order confirmations. |
| Secrets | **Azure Key Vault + Managed Identity** | Stripe keys, DB connection string. |
| CI/CD | **GitHub Actions → App Service** | One YAML file, no container build. |
| Observability | **Application Insights** | Logs, traces, metrics. |
| CORS | Locked to the Vercel domain | API is cross-origin. |
| Real-time (optional, later) | Azure SignalR Service | Live admin order updates. Phase 2 only. |

**Explicitly excluded:** Docker, Kubernetes/AKS, Cosmos DB, microservices, AKS-for-learning.
The team decided against containers — deploy straight to App Service.

---

## 3. Architecture

```
Browser ──> Next.js (Vercel)  ──reads──>  Sanity CMS   (menu, gallery, content)
                  │
                  └──orders/payment/auth──>  ASP.NET Core API (Azure App Service)
                                                  │
                                                  ├── Azure SQL        (users, orders, customers)
                                                  ├── Stripe           (PaymentIntents + webhook)
                                                  ├── Key Vault        (secrets)
                                                  ├── Resend / ACS     (confirmation emails)
                                                  └── App Insights     (logs/traces)
```

---

## 4. User Roles & Order Access

Three kinds of user, **one** account model. The difference is a role.

| Who | Account? | Capabilities |
|---|---|---|
| **Guest** | No | Place order, pay, get confirmation email + order-lookup link. **Full service — no degradation.** |
| **Customer** | Yes (optional) | Everything a guest does, plus a logged-in "My Orders" history page. |
| **Owner (Admin)** | Yes, `Admin` role | View **all** orders; update each order's status. |

**Critical requirement:** The order/payment flow is **identical** whether or not the user has an
account. An account only adds the ability to *look back* at past orders. Guest checkout must never
be second-class.

Roles: **`Customer`** (default on signup), **`Admin`** (assigned once to the owner's account).

---

## 5. Payment Flow (Stripe) — security-critical

```
1. Customer builds cart in Next.js, hits "Pay"
2. Next.js sends cart (item IDs + quantities) to the .NET API
3. API looks up REAL prices (Sanity / its DB), computes the total server-side
4. API calls Stripe → creates a PaymentIntent for that server-computed amount
5. Stripe returns client_secret → API returns it to Next.js
6. Stripe.js on the frontend collects the card and confirms payment
7. Stripe calls API webhook ("payment succeeded") → API marks order paid + status = NotStarted
```

**Non-negotiable rules:**
- **Server computes the total.** Never trust a client-supplied price/amount.
- **The webhook is the source of truth** for payment success — not the browser response.
- **Card details go browser → Stripe directly**, never through our servers (keeps PCI scope minimal).
- **Verify the Stripe webhook signature.** Reject unsigned/invalid calls.
- Stripe secret key + webhook signing secret live in **Key Vault**, never in code or env files in the repo.

---

## 6. Data Model

```
User (ASP.NET Core Identity)
  ├── Id, Email, PasswordHash, ...   (Identity-managed)
  └── Role: Customer | Admin

Order
  ├── Id
  ├── UserId            (nullable — NULL = guest order; this is what unifies guest + account checkout)
  ├── CustomerEmail     (always captured — confirmation + guest lookup)
  ├── GuestLookupToken  (random; lets a guest view their order via emailed link)
  ├── Status            ── enum: NotStarted | Ongoing | Completed
  ├── StripePaymentIntentId
  ├── PaidAt
  ├── CreatedAt
  └── OrderItems[]      (item id, name snapshot, unit price snapshot, qty)

OrderItem
  ├── Id, OrderId
  ├── MenuItemId        (reference to Sanity item)
  ├── NameSnapshot      (store name/price AT TIME OF ORDER — Sanity content can change later)
  ├── UnitPriceSnapshot
  └── Quantity
```

**Design notes:**
- `Order.UserId` **nullable** is the mechanism that makes guest and account checkout the same code path.
- Store **price/name snapshots** on `OrderItem` so historical orders stay correct if the menu changes.
- Future enhancement (not now): if a guest later signs up with the same email, claim their past guest orders.

---

## 7. Order Status Workflow

```
NotStarted ──> Ongoing ──> Completed
  (paid,         (kitchen      (ready / picked
   just in)       making it)    up / done)
```

- Order auto-enters `NotStarted` when the **Stripe webhook** confirms payment.
- Only an **Admin** may change status: `PATCH /api/orders/{id}/status`.

---

## 8. API Surface (initial)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Public | Create order from cart, compute total, create Stripe PaymentIntent, return client_secret |
| POST | `/api/webhooks/stripe` | Stripe sig | Mark order paid → status NotStarted; send confirmation email |
| GET | `/api/orders/lookup/{token}` | Public (token) | Guest order lookup via emailed link |
| POST | `/api/auth/register` | Public | Customer signup (role = Customer) |
| POST | `/api/auth/login` | Public | Issue JWT |
| GET | `/api/me/orders` | Customer | Logged-in user's order history |
| GET | `/api/admin/orders` | Admin | All orders, filterable by status |
| PATCH | `/api/orders/{id}/status` | Admin | Move order between NotStarted/Ongoing/Completed |

---

## 9. Frontend Touchpoints (Next.js, on Vercel)

- Wire the existing `order` page → `POST /api/orders` + Stripe.js (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- New **`/admin`** protected route → admin dashboard (calls `/api/admin/orders`, `PATCH .../status`). Admin-role JWT required.
- New **"My Orders"** page for logged-in customers.
- New auth UI (register / login) storing the JWT.
- Admin dashboard live updates: **start with polling (~10–15s)**; SignalR is Phase 2 only.

---

## 10. Work Packages (for delegation)

> Coordinator: these are sized for individual sub-agents. **Dependencies** must be respected.
> Each has acceptance criteria. WP-1 through WP-3 are foundational and largely sequential;
> several later packages can run in parallel once the foundation exists.

### WP-1 — Project scaffold & infra baseline  *(no deps)*
- ASP.NET Core 8 Minimal API solution structure.
- EF Core 8 wired to Azure SQL (connection string from config/Key Vault).
- App Insights + structured logging.
- CORS policy locked to the Vercel domain.
- **Acceptance:** API runs locally, connects to a SQL DB, `/health` returns 200.

### WP-2 — Data model & migrations  *(deps: WP-1)*
- EF Core entities: `User` (Identity), `Order`, `OrderItem`, `OrderStatus` enum.
- Initial migration; nullable `UserId`; price/name snapshots on `OrderItem`.
- **Acceptance:** `dotnet ef database update` creates the schema; seed an `Admin` user.

### WP-3 — Auth (Identity + JWT + roles)  *(deps: WP-2)*
- ASP.NET Core Identity, JWT issuance, `Customer`/`Admin` roles.
- `register`, `login` endpoints; role-based authorization attributes.
- One-time mechanism to grant the owner the `Admin` role.
- **Acceptance:** Can register a Customer, log in, receive a JWT; Admin-only endpoint rejects non-admins (403).

### WP-4 — Orders core (create + server-side pricing)  *(deps: WP-2)*  ⟂ can parallel WP-3
- `POST /api/orders`: validate cart, **compute total server-side** against Sanity/DB prices, persist order, create Stripe PaymentIntent, return client_secret.
- Guest path (nullable UserId, generate GuestLookupToken) + logged-in path (stamp UserId).
- **Acceptance:** Posting a cart returns a client_secret for the correct server-computed amount; tampered client prices are ignored.

### WP-5 — Stripe webhook & payment confirmation  *(deps: WP-4)*
- `POST /api/webhooks/stripe` with **signature verification**.
- On success: mark order paid, set status `NotStarted`, trigger confirmation email (Resend).
- **Acceptance:** Simulated Stripe webhook (valid sig) marks order paid; invalid sig rejected.

### WP-6 — Order status & admin endpoints  *(deps: WP-3, WP-4)*
- `GET /api/admin/orders` (Admin, filterable), `PATCH /api/orders/{id}/status` (Admin).
- `GET /api/me/orders` (Customer), `GET /api/orders/lookup/{token}` (guest).
- **Acceptance:** Admin can list and transition orders; customer sees only their own; guest token works.

### WP-7 — Secrets & deployment  *(deps: WP-1; finalize after WP-5)*
- Azure Key Vault + Managed Identity for Stripe keys + DB connection string.
- GitHub Actions workflow → Azure App Service.
- **Acceptance:** Push to main deploys; no secrets in repo; app reads secrets from Key Vault.

### WP-8 — Frontend integration  *(deps: WP-4, WP-5, WP-6)*  — Next.js repo
- Wire `order` page to the orders API + Stripe.js.
- Auth UI (register/login + JWT storage), "My Orders" page.
- `/admin` protected dashboard with status controls, polling refresh.
- **Acceptance:** End-to-end: place a guest order + pay (Stripe test mode); owner sees it in `/admin` and moves it to Completed.

### WP-9 (Phase 2, optional) — Real-time admin updates  *(deps: WP-6, WP-8)*
- Azure SignalR Service; push new/changed orders to the admin dashboard.
- **Acceptance:** New paid order appears in `/admin` without a manual refresh.

---

## 11. Suggested Delegation Order

1. **WP-1** → then **WP-2**.
2. In parallel after WP-2: **WP-3 (auth)** and **WP-4 (orders core)**.
3. **WP-5 (Stripe webhook)** after WP-4.
4. **WP-6 (admin/status)** after WP-3 + WP-4.
5. **WP-7 (secrets/deploy)** can start early (WP-1), finalized after WP-5.
6. **WP-8 (frontend)** once WP-4/5/6 are stable.
7. **WP-9 (SignalR)** only if the owner wants live updates.

---

## 12. Cross-Cutting Acceptance / Guardrails

- [ ] Guest checkout has **zero** feature/quality difference from account checkout.
- [ ] Order totals are **always** computed server-side; client prices are never trusted.
- [ ] Stripe webhook signature is verified; payment state is set only from the webhook.
- [ ] No secrets (Stripe keys, DB strings) committed to either repo — all via Key Vault.
- [ ] Admin endpoints reject non-admin tokens (403).
- [ ] OrderItem stores price/name snapshots (historical orders survive menu changes).
- [ ] Sanity remains the menu source of truth; no menu data duplicated into SQL.
- [ ] CORS restricted to the production Vercel domain.
```
