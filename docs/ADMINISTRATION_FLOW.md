# Administration Flow Implementation Specification

## 1. Objective

Implement a production-ready administration flow for My Wife's Dumplings.

The completed flow must allow the owner to:

1. Sign in with the seeded administrator account.
2. View and search all orders.
3. Filter orders by preparation status.
4. Refresh orders manually and receive automatic updates.
5. Move paid orders through the existing lifecycle.
6. Review an audit history of status changes.
7. Change the administrator password securely.
8. Receive clear feedback when authentication, loading, or updates fail.

The production administration route is:

```text
https://my-wifes-dumplings.vercel.app/admin
```

## 2. Existing architecture

Frontend:

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Authentication state in `src/lib/auth/auth-context.tsx`
- Admin dashboard in `src/app/admin/page.tsx`
- API client in `src/lib/api/client.ts`
- API wire types in `src/lib/api/types.ts`

Backend:

- ASP.NET Core 8 minimal API
- ASP.NET Core Identity
- Entity Framework Core
- Azure SQL
- Azure Key Vault
- Application Insights
- JWT bearer authentication

Existing admin API:

```text
GET   /api/admin/orders
PATCH /api/orders/{id}/status
```

Existing order statuses:

```text
NotStarted = 0
Ongoing    = 1
Completed  = 2
```

## 3. Fixed product decisions

The implementation agent must follow these decisions.

### 3.1 Authentication

- Keep the existing JWT bearer authentication.
- Keep JWT storage in `localStorage` for this implementation phase.
- Do not migrate authentication to cookies.
- Continue enforcing the `Admin` role on every admin API endpoint.
- Public registration must continue assigning only the `Customer` role.
- Invalid login responses must not reveal whether an email exists.

### 3.2 Order lifecycle

Keep the existing lifecycle unchanged:

```text
Not started → Ongoing → Completed
```

- Do not add cancellation, refund, pickup, or delivery statuses.
- Do not allow backward transitions.
- Do not allow skipping a state.
- Do not allow status changes on unpaid orders.
- Do not change payment fields during an admin status update.

Allowed transitions:

| Current status | Allowed next status |
|---|---|
| `NotStarted` | `Ongoing` |
| `Ongoing` | `Completed` |
| `Completed` | None |

### 3.3 Administrator password

Implement authenticated self-service password change.

- The administrator must provide the current password.
- The administrator must provide and confirm the new password.
- The new password must satisfy ASP.NET Core Identity validation.
- A successful password change must invalidate the current browser session and redirect to login.
- Do not implement email-based password recovery.
- Do not reset an existing password automatically from `Seed--AdminPassword`.

### 3.4 Audit history

Persist order status changes in Azure SQL.

Every successful status change must record:

- Audit record ID
- Order ID
- Administrator user ID
- Administrator email
- Previous status
- New status
- UTC timestamp

Failed or rejected status changes must not create audit records.

### 3.5 Dashboard refresh

- Keep automatic polling at 12 seconds.
- Add a manual refresh button.
- Display the last successful refresh time.
- Preserve the current order list when a background refresh fails.
- Display a visible non-blocking warning when refresh fails.

## 4. Scope

### 4.1 In scope

- Login rate limiting
- Administrator password change
- Strict forward-only order transitions
- Status-change audit records
- Admin order search
- Existing status filters
- Manual refresh
- Last-refreshed indicator
- Polling failure feedback
- Completed-status confirmation dialog
- Duplicate-action prevention
- Backend and frontend automated tests
- EF Core migration
- Application Insights logging for relevant admin events
- Documentation updates

### 4.2 Out of scope

- Cookie-based authentication
- Refresh tokens
- Multi-factor authentication
- Email password recovery
- Additional administrator accounts UI
- New order statuses
- Cancellation or refund workflows
- Customer notifications on status changes
- SignalR or WebSocket updates
- Editing order contents
- Deleting orders
- Exporting reports
- Changing Stripe payment records
- Azure alert-rule provisioning

Do not implement out-of-scope work unless a required in-scope feature cannot function without it.

## 5. Backend requirements

### 5.1 Login rate limiting

Add ASP.NET Core rate limiting to:

```text
POST /api/auth/login
```

Required policy:

- Partition by normalized request IP address.
- Permit 5 login attempts per 1-minute fixed window.
- Queue limit: 0.
- Return HTTP `429` when limited.
- Include a `Retry-After` response header where supported.
- Do not apply this restrictive policy to normal authenticated API traffic.

The frontend must display:

```text
Too many login attempts. Please wait a minute and try again.
```

### 5.2 Password-change endpoint

Add:

```text
POST /api/admin/change-password
```

Authorization:

```text
Admin role required
```

Request:

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

Responses:

| Condition | Response |
|---|---|
| Success | HTTP `204` |
| New passwords do not match | HTTP `400` validation problem |
| Current password is incorrect | HTTP `400` with a generic error |
| New password fails Identity rules | HTTP `400` validation problem |
| Missing/invalid JWT | HTTP `401` |
| Authenticated non-admin | HTTP `403` |

The endpoint must identify the user from JWT claims. It must never accept a user ID or email from the request body.

Log a successful administrator password change to Application Insights without logging either password.

### 5.3 Status transition enforcement

Update `OrderAdminService` so it enforces the allowed transition table.

Add a new outcome:

```text
InvalidTransition
```

Return HTTP `409` for an invalid transition.

Example response:

```json
{
  "error": "Order status can only move from Not started to Ongoing to Completed."
}
```

Retain existing outcomes:

- Invalid enum value: HTTP `400`
- Order not found: HTTP `404`
- Unpaid order: HTTP `409`

### 5.4 Audit entity and migration

Create an entity named:

```text
OrderStatusAudit
```

Required fields:

```csharp
long Id
int OrderId
string AdminUserId
string AdminEmail
OrderStatus PreviousStatus
OrderStatus NewStatus
DateTime ChangedAtUtc
```

Database requirements:

- Add `DbSet<OrderStatusAudit>` to `AppDbContext`.
- Add a required foreign key to `Order`.
- Deleting an order must cascade-delete its audit records.
- `AdminUserId` maximum length: 450.
- `AdminEmail` maximum length: 256.
- Add an index on `(OrderId, ChangedAtUtc)`.
- Generate and commit an EF Core migration.

The status update and audit insert must be persisted in one `SaveChangesAsync` operation.

### 5.5 Status update identity

The status endpoint must extract:

- Administrator user ID from the JWT subject/name identifier.
- Administrator email from the JWT email claim.

Pass both values into `OrderAdminService.UpdateStatusAsync`.

Do not accept administrator identity fields from the client.

### 5.6 Audit read endpoint

Add:

```text
GET /api/admin/orders/{id}/audit
```

Authorization:

```text
Admin role required
```

Response shape:

```json
[
  {
    "id": 1,
    "orderId": 42,
    "adminEmail": "owner@example.com",
    "previousStatus": "NotStarted",
    "newStatus": "Ongoing",
    "changedAtUtc": "2026-06-20T01:00:00Z"
  }
]
```

Rules:

- Return records oldest first.
- Do not expose `AdminUserId` in the response.
- Return HTTP `404` if the order does not exist.

### 5.7 Admin order search

Extend:

```text
GET /api/admin/orders
```

Supported query parameters:

```text
status
search
```

Search behavior:

- Trim whitespace.
- Empty search means no search filter.
- If `search` parses as an integer, match exact order ID.
- Otherwise match `CustomerEmail` case-insensitively using a SQL-translatable query.
- Search and status filters must work together.
- Results remain newest first.

### 5.8 Observability

Use structured `ILogger` messages for:

- Successful admin login
- Rejected admin login without revealing password information
- Login rate-limit rejection
- Successful password change
- Successful order status change
- Rejected invalid transition
- Admin order-list query failure

Never log:

- Passwords
- JWTs
- Stripe secrets
- Guest lookup tokens
- Full request authorization headers

## 6. Frontend requirements

### 6.1 Login page

Handle HTTP `429` explicitly with:

```text
Too many login attempts. Please wait a minute and try again.
```

Retain the existing generic invalid-credentials message for HTTP `401`.

### 6.2 Admin dashboard header

The header must contain:

- Page title
- Signed-in administrator email
- Last successful refresh time
- Manual refresh button
- Change password button
- Log out button

Manual refresh behavior:

- Disable the button while refreshing.
- Show a loading indicator or `Refreshing…` label.
- Do not clear the existing order list.

### 6.3 Search and filters

Add a labeled search field with placeholder:

```text
Search order number or customer email
```

Behavior:

- Debounce API requests by 300 milliseconds.
- Preserve the existing status filter chips.
- Send both `status` and `search` to the API.
- Provide a clear-search control.
- Display `No orders match the current filters.` when the filtered list is empty.

### 6.4 Refresh feedback

On successful load:

- Update the last-refreshed timestamp.
- Clear any previous refresh warning.

On background refresh failure:

- Keep existing orders visible.
- Show:

```text
Orders could not be refreshed. Showing the last successful results.
```

On initial load failure with no existing data:

- Show the error.
- Show a retry button.

### 6.5 Status updates

- Continue showing only the next valid action.
- Disable all status controls for the order being updated.
- Prevent duplicate requests.
- Keep unpaid orders locked.
- Require confirmation before changing `Ongoing` to `Completed`.

Confirmation copy:

```text
Mark order #{id} as completed?
```

The confirmation must include **Cancel** and **Mark completed** actions.

Use an accessible dialog component already available in the project, or implement an accessible native dialog. Do not use `window.confirm`.

### 6.6 Audit history UI

Add a `View history` action to each order card.

Behavior:

- Open an accessible dialog or expandable panel.
- Load audit data only when opened.
- Show a loading state.
- Show each transition with:
  - Previous status
  - New status
  - Administrator email
  - Localized date/time
- Show `No status changes recorded.` for an empty history.
- Show a retryable error if loading fails.

### 6.7 Change-password UI

Add an accessible dialog opened from the dashboard header.

Fields:

- Current password
- New password
- Confirm new password

Requirements:

- All fields are required.
- Use password inputs with show/hide controls.
- Validate matching new passwords before submission.
- Disable submission while pending.
- Display backend validation errors.
- On HTTP `204`, clear the auth session and redirect to:

```text
/login?passwordChanged=true
```

The login page must display:

```text
Password changed successfully. Please log in again.
```

### 6.8 Accessibility and responsive behavior

- All controls must be keyboard accessible.
- Every input must have a label.
- Dialog focus must be trapped and restored when closed.
- Error and success messages must use appropriate live-region semantics.
- Touch targets must be at least 44 by 44 CSS pixels.
- The dashboard must not introduce horizontal scrolling at 375px width.
- Search, filters, and header actions must wrap cleanly on mobile.

## 7. API client and type changes

Update the frontend API client with:

```typescript
adminOrders(
  token: string,
  options?: {
    status?: OrderStatus;
    search?: string;
    signal?: AbortSignal;
  },
): Promise<OrderSummary[]>

updateOrderStatus(
  id: number,
  status: OrderStatus,
  token: string,
): Promise<OrderSummary>

getOrderAudit(
  id: number,
  token: string,
  signal?: AbortSignal,
): Promise<OrderStatusAudit[]>

changeAdminPassword(
  payload: ChangePasswordRequest,
  token: string,
): Promise<void>
```

Add TypeScript types:

```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface OrderStatusAudit {
  id: number;
  orderId: number;
  adminEmail: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedAtUtc: string;
}
```

URL-encode all query parameters.

## 8. Automated test requirements

### 8.1 Backend unit/integration tests

Add or update tests proving:

- Public registration cannot create an administrator.
- Login returns the administrator role for the seeded admin.
- Login rate limiting returns HTTP `429` after the configured limit.
- Password change rejects an incorrect current password.
- Password change rejects mismatched new passwords.
- Password change rejects weak passwords.
- Password change succeeds with correct credentials.
- Password change requires the Admin role.
- Unpaid orders cannot transition.
- `NotStarted → Ongoing` succeeds.
- `Ongoing → Completed` succeeds.
- `NotStarted → Completed` fails.
- `Ongoing → NotStarted` fails.
- `Completed → Ongoing` fails.
- A successful transition creates exactly one audit record.
- A rejected transition creates no audit record.
- Payment fields remain unchanged after status updates.
- Audit history returns oldest first.
- Audit history requires the Admin role.
- Order search matches exact order ID.
- Order search matches customer email case-insensitively.
- Search combines correctly with status filtering.

### 8.2 Frontend tests

Add or update tests proving:

- HTTP `429` displays the rate-limit message.
- Logged-out admin navigation redirects to login.
- A customer sees the admins-only state.
- Search is debounced and sent to the API.
- Manual refresh does not clear existing orders.
- Failed background polling preserves existing orders and shows a warning.
- Initial load failure displays retry.
- Completion requires confirmation.
- Duplicate status submissions are blocked.
- Audit history loads on demand.
- Password mismatch is caught client-side.
- Successful password change logs out and redirects.

Mock network requests. Automated tests must not require live Azure, Stripe, Resend, or Vercel services.

## 9. Manual acceptance tests

After automated tests pass:

1. Sign in to production using the administrator account.
2. Confirm the dashboard loads existing orders.
3. Search by an order number.
4. Search by customer email.
5. Filter by each status.
6. Create a new Stripe test-mode order.
7. Confirm it appears within 12 seconds.
8. Mark it ongoing.
9. Confirm the tracking page shows ongoing.
10. Mark it completed after accepting the confirmation dialog.
11. Confirm the tracking page shows completed.
12. Open audit history and confirm both transitions are listed.
13. Change the administrator password.
14. Confirm the session is cleared.
15. Confirm the old password fails.
16. Confirm the new password succeeds.
17. Test the dashboard at desktop and 375px mobile width.

Do not perform the production password-change acceptance test unless the user explicitly authorizes changing the live administrator password.

## 10. Implementation sequence

Implement in this order:

1. Add audit entity, EF configuration, and migration.
2. Enforce forward-only transitions and create audit records.
3. Add audit read endpoint.
4. Add admin order search.
5. Add login rate limiting.
6. Add password-change endpoint.
7. Update frontend API types and client.
8. Add dashboard refresh and search improvements.
9. Add completion confirmation.
10. Add audit-history UI.
11. Add password-change UI.
12. Add backend tests.
13. Add frontend tests.
14. Run full verification.
15. Update relevant documentation.

## 11. Required verification commands

Run the repository-equivalent commands for:

```text
dotnet restore
dotnet build --configuration Release
dotnet test --configuration Release
npm test -- --run
npm run lint
npm run build
git diff --check
```

If any command cannot run because of the local environment, report the exact limitation and run the closest available verification.

## 12. Guardrails

- Preserve unrelated user changes in the working tree.
- Do not commit secrets or real credentials.
- Do not change Stripe payment confirmation behavior.
- Do not allow admin actions to write `PaidAt` or `StripePaymentIntentId`.
- Do not expose guest lookup tokens in admin list or audit responses.
- Do not weaken server-side role authorization.
- Do not introduce new production infrastructure without approval.
- Do not change live Azure secrets, GitHub secrets, Vercel variables, or administrator passwords without explicit user authorization.
- Generate an EF migration; do not hand-edit the model snapshot as a substitute.
- Keep all timestamps in the database and API as UTC.

## 13. Definition of done

The task is complete only when:

- Every in-scope backend and frontend requirement is implemented.
- The EF migration is committed.
- Required automated tests pass.
- Build and lint pass.
- Existing payment and customer order flows remain working.
- No secrets are added to source control.
- The implementation agent reports changed files, migration name, tests run, and any residual risk.
