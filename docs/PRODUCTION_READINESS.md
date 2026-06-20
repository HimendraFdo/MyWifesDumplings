# Production Readiness Runbook

## 1. Purpose

Use this runbook before My Wife's Dumplings begins accepting real customer orders and real Stripe payments.

It covers:

1. Removing test orders and test customer accounts.
2. Confirming the production menu and prices in Sanity.
3. Configuring Application Insights monitoring and alerts.
4. Setting an Azure spending budget.
5. Reviewing Azure SQL backups and firewall rules.
6. Replacing temporary administrator credentials.

This document contains destructive and billable operations. Complete the approval gates before making changes.

## 2. Current production resources

The current Azure resources are:

```text
Resource group: mywifesdumplings-prod
App Service:    mywifesdumplings-api-06e2be
Key Vault:      mwd-vault-06e2be
SQL Server:     mwd-sql-06e2be
SQL Database:   mywifesdumplings
Region:         australiaeast
```

The production frontend is:

```text
https://my-wifes-dumplings.vercel.app
```

The production API is:

```text
https://mywifesdumplings-api-06e2be.azurewebsites.net
```

The Sanity dataset is:

```text
production
```

## 3. Execution rules

### 3.1 Required approvals

Obtain explicit user approval immediately before:

- Deleting orders.
- Deleting customer accounts.
- Changing administrator credentials.
- Creating billable Azure resources.
- Creating alert rules that may incur charges.
- Changing SQL backup retention.
- Removing or adding SQL firewall rules.
- Editing published Sanity menu content or prices.

General approval to “complete production readiness” is not sufficient authorization for destructive operations. Present the exact records, resources, and proposed change first.

### 3.2 Secret handling

- Never write passwords, connection strings, Stripe keys, Resend keys, or Sanity tokens into this repository.
- Never print secret values into chat, logs, screenshots, or committed files.
- Collect passwords through hidden terminal prompts or the relevant provider dashboard.
- Store production secrets in Azure Key Vault.
- Store human-managed credentials in a trusted password manager.

### 3.3 Evidence

Create a dated completion record from the template in section 11. Record:

- What was checked.
- What changed.
- Who approved destructive or billable changes.
- Relevant resource names.
- Counts, statuses, and timestamps.
- No secret values.

## 4. Preflight

Complete these checks before modifying production.

### 4.1 Azure login and resource selection

Use Azure Cloud Shell in Bash mode:

```bash
az account show \
  --query "{subscription:name, subscriptionId:id, tenantId:tenantId, user:user.name}" \
  --output table
```

Set the resource variables:

```bash
RG="mywifesdumplings-prod"
LOC="australiaeast"
APP="mywifesdumplings-api-06e2be"
VAULT="mwd-vault-06e2be"
SQL="mwd-sql-06e2be"
DB="mywifesdumplings"
```

Verify all resources exist:

```bash
az resource list \
  --resource-group "$RG" \
  --query "[].{name:name,type:type,location:location}" \
  --output table
```

### 4.2 Health checks

```bash
curl -i --max-time 30 \
  "https://${APP}.azurewebsites.net/health"
```

Expected:

```text
HTTP 200
{"status":"ok"}
```

Also confirm:

- The Vercel website loads.
- Admin login works.
- The production Sanity Studio opens.
- Stripe remains in test mode until the final live-mode cutover.

### 4.3 Code and database state

Before cleanup:

- Confirm the latest `main` deployment is green.
- Confirm all EF Core migrations are applied.
- Confirm no production customer orders have been accepted.
- Confirm the current administrator can log in.

Do not remove data if there is any uncertainty about whether it is test or real data.

## 5. Remove test orders and accounts

### 5.1 Policy

The cleanup must:

- Preserve the administrator account.
- Delete only explicitly approved test customer accounts.
- Delete only explicitly approved test orders.
- Delete dependent order items and audit records through configured cascade relationships.
- Preserve Identity roles.
- Avoid changing schema or migrations.

### 5.2 Create a backup first

Azure SQL automatically provides point-in-time restore, but create a deliberate pre-cleanup restore point by recording:

- Current UTC time.
- Database name.
- Earliest restore point.
- Current service tier.

Inspect:

```bash
az sql db show \
  --resource-group "$RG" \
  --server "$SQL" \
  --name "$DB" \
  --query "{name:name,status:status,tier:currentServiceObjectiveName,earliestRestoreDate:earliestRestoreDate}" \
  --output table
```

Record the output before continuing.

For higher assurance, create a copy before cleanup:

```bash
BACKUP_DB="mywifesdumplings-prelaunch-$(date +%Y%m%d)"

az sql db copy \
  --resource-group "$RG" \
  --server "$SQL" \
  --name "$DB" \
  --dest-resource-group "$RG" \
  --dest-server "$SQL" \
  --dest-name "$BACKUP_DB"
```

Creating a database copy is billable. Obtain approval before running this command.

### 5.3 Inventory data before deletion

Use the Azure Portal Query Editor, SQL Server Management Studio, Azure Data Studio, or another approved SQL client.

Run read-only inventory queries:

```sql
SELECT
    COUNT(*) AS OrderCount,
    MIN(CreatedAt) AS EarliestOrderUtc,
    MAX(CreatedAt) AS LatestOrderUtc
FROM Orders;

SELECT
    Id,
    CustomerEmail,
    CreatedAt,
    PaidAt,
    Status,
    StripePaymentIntentId
FROM Orders
ORDER BY CreatedAt DESC;

SELECT
    Id,
    Email,
    EmailConfirmed
FROM AspNetUsers
ORDER BY Email;

SELECT
    u.Id,
    u.Email,
    r.Name AS RoleName
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON ur.UserId = u.Id
LEFT JOIN AspNetRoles r ON r.Id = ur.RoleId
ORDER BY u.Email, r.Name;
```

Export or capture the inventory without exposing password hashes, security stamps, tokens, or other Identity internals.

### 5.4 Define the cleanup set

Prepare explicit lists:

```text
Approved order IDs to delete:
- ...

Approved customer emails to delete:
- ...

Administrator email to preserve:
- ...
```

Do not use broad conditions such as:

```sql
DELETE FROM Orders;
DELETE FROM AspNetUsers;
```

unless the user has reviewed the inventory and explicitly approved deleting every matching record.

### 5.5 Execute cleanup transaction

Use a transaction and explicit IDs/emails.

Template:

```sql
BEGIN TRANSACTION;

-- Replace with explicitly approved IDs only.
DELETE FROM Orders
WHERE Id IN (/* approved order IDs */);

-- Replace with explicitly approved customer emails only.
-- Never include the administrator email.
DELETE FROM AspNetUsers
WHERE NormalizedEmail IN (
    /* approved normalized emails, e.g. 'TEST@EXAMPLE.COM' */
);

SELECT COUNT(*) AS RemainingOrders FROM Orders;

SELECT
    u.Email,
    r.Name AS RoleName
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON ur.UserId = u.Id
LEFT JOIN AspNetRoles r ON r.Id = ur.RoleId
ORDER BY u.Email, r.Name;

-- Review the results before choosing one:
-- COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;
```

Only commit after confirming:

- The administrator still exists.
- The administrator still has the `Admin` role.
- Only approved test records were removed.

### 5.6 Cleanup verification

- Admin login still works.
- Admin dashboard loads.
- Removed orders no longer appear.
- Existing approved records still appear.
- API `/health` returns HTTP `200`.
- No database or Identity errors appear in Application Insights.

## 6. Confirm real menu items and prices in Sanity

### 6.1 Source-of-truth rule

Sanity is the menu and pricing source of truth.

Priced order lines use the Sanity document `_id` of:

- `pricingTier`
- `extra`

The backend retrieves the current server-side name and price from Sanity before creating a Stripe PaymentIntent. The frontend must never be treated as the authoritative price source.

### 6.2 Review `menuItem` documents

For every published menu item, confirm:

- `name` is customer-facing and correctly spelled.
- `slug` exists.
- `tagline` accurately lists key ingredients.
- `description` is accurate.
- `image` is the correct product image.
- Image hotspot/crop is acceptable on desktop and mobile.
- `available` is correct.
- `order` produces the intended display order.
- Allergen and dietary information is present where required by the business.

Unavailable products must have:

```text
available = false
```

Do not delete a temporarily unavailable product solely to hide it.

### 6.3 Review `pricingTier` documents

For every tier, confirm:

- `quantity` is the intended dumpling count.
- `price` is the final NZD customer price.
- `includes` accurately describes bundled extras.
- Exactly the intended tier is marked `featured`.
- No duplicate quantities exist.
- No zero or negative quantity/price exists.

Record approved prices in the readiness evidence.

### 6.4 Review `extra` documents

For every extra, confirm:

- `name` is customer-facing.
- `price` is the final NZD unit price.
- No duplicate extras exist.
- No zero or negative price exists unless the item is intentionally free.

### 6.5 Preserve document IDs

Do not delete and recreate pricing tiers or extras merely to rename or reprice them.

Their Sanity `_id` values are used as `menuItemId` values by the order API. Edit existing documents in place so IDs remain stable.

### 6.6 Publish and verify

After approved edits:

1. Publish all intended Sanity documents.
2. Confirm no required document remains as an unpublished draft.
3. Trigger/review the Vercel revalidation webhook if configured.
4. Open the production menu and order pages.
5. Confirm names, images, quantities, and prices match Sanity.
6. Add one item to the cart and confirm the displayed subtotal.
7. Create one Stripe test-mode order.
8. Confirm the Stripe PaymentIntent amount equals the Sanity-derived total.
9. Confirm the persisted order snapshots show the approved names and prices.

Do not switch Stripe to live mode until this verification passes.

## 7. Configure Application Insights and alerts

### 7.1 Existing application integration

The backend already calls:

```csharp
builder.Services.AddApplicationInsightsTelemetry();
```

The production connection string is expected in Azure Key Vault:

```text
ApplicationInsights--ConnectionString
```

### 7.2 Create or identify the Application Insights resource

First check:

```bash
az monitor app-insights component list \
  --resource-group "$RG" \
  --query "[].{name:name,appId:appId,location:location}" \
  --output table
```

If none exists, propose a resource name and estimated impact before creating one.

Example:

```bash
APPINSIGHTS="mywifesdumplings-insights"

az monitor app-insights component create \
  --app "$APPINSIGHTS" \
  --location "$LOC" \
  --resource-group "$RG" \
  --application-type web
```

Resource creation may affect cost. Obtain approval first.

### 7.3 Store the connection string

Read it without posting it:

```bash
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app "$APPINSIGHTS" \
  --resource-group "$RG" \
  --query connectionString -o tsv)

az keyvault secret set \
  --vault-name "$VAULT" \
  --name "ApplicationInsights--ConnectionString" \
  --value "$APPINSIGHTS_CONNECTION_STRING"

unset APPINSIGHTS_CONNECTION_STRING
```

Restart the App Service after setting it:

```bash
az webapp restart \
  --name "$APP" \
  --resource-group "$RG"
```

### 7.4 Verify telemetry

After the app is healthy:

1. Request `/health`.
2. Log in as admin.
3. Load the admin dashboard.
4. Create one Stripe test order.
5. Wait for telemetry ingestion.
6. Confirm requests, dependencies, traces, and exceptions appear.

Useful KQL:

```kusto
requests
| where timestamp > ago(1h)
| order by timestamp desc

dependencies
| where timestamp > ago(1h)
| order by timestamp desc

exceptions
| where timestamp > ago(24h)
| order by timestamp desc
```

### 7.5 Required alerts

Configure these alerts in Azure Monitor:

#### API availability

- Target: `https://mywifesdumplings-api-06e2be.azurewebsites.net/health`
- Test frequency: 5 minutes.
- Expected response: HTTP `200`.
- Alert after at least two consecutive failures.

#### Server errors

- Signal: failed requests or HTTP `5xx`.
- Evaluation period: 5 minutes.
- Trigger when failures are greater than 0.

#### Unhandled exceptions

- Signal: Application Insights exception count.
- Evaluation period: 5 minutes.
- Trigger when exceptions are greater than 0.

#### Database dependency failures

- Signal: failed SQL dependencies.
- Evaluation period: 5 minutes.
- Trigger when failures are greater than 0.

#### Optional latency alert

- Signal: server response time.
- Trigger when average or percentile latency exceeds the agreed threshold.
- Suggested initial threshold: 3 seconds over 10 minutes.

Create an Azure Monitor action group containing the owner's operational email address. Test the action group after creation.

Availability tests and alert rules can affect cost. Obtain approval before creation.

### 7.6 Alert verification

- Action group test notification arrives.
- Availability test is green.
- Alert rules are enabled.
- Alert severity and names are understandable.
- No alert contains secrets or personal customer data.
- Application Insights retention is reviewed.
- Daily ingestion cap is reviewed to avoid unexpected cost.

Official references:

- [Application Insights overview](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Availability tests](https://learn.microsoft.com/azure/azure-monitor/app/availability)
- [Azure Monitor alerts](https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-overview)

## 8. Set an Azure spending budget

### 8.1 Budget decision

The user must choose:

- Monthly budget amount.
- Budget start date.
- Notification email.
- Whether alerts are informational only or trigger operational action.

Suggested starting thresholds:

| Threshold | Purpose |
|---|---|
| 50% | Early warning |
| 75% | Review current spend |
| 90% | Urgent review |
| 100% | Budget exceeded |

A budget sends notifications; it does not automatically stop Azure resources.

### 8.2 Create through Azure Portal

1. Open **Cost Management + Billing**.
2. Select the active subscription.
3. Open **Budgets**.
4. Select **Add**.
5. Scope the budget to either:
   - The entire student subscription, or
   - Resource group `mywifesdumplings-prod`.
6. Select a monthly reset period.
7. Enter the approved amount.
8. Add alerts at 50%, 75%, 90%, and 100%.
9. Add the owner's monitored email.
10. Save.

For a student subscription, also monitor the remaining student credit and expiration date.

### 8.3 Budget verification

- Budget appears under the intended scope.
- Currency and amount are correct.
- Reset period is monthly.
- All notification thresholds exist.
- Notification email is correct.
- Current forecast and actual spend are visible.

Official reference:

- [Create and manage Azure budgets](https://learn.microsoft.com/azure/cost-management-billing/costs/tutorial-acm-create-budgets)

## 9. Review Azure SQL backups and firewall rules

### 9.1 Database status and tier

```bash
az sql db show \
  --resource-group "$RG" \
  --server "$SQL" \
  --name "$DB" \
  --query "{status:status,tier:currentServiceObjectiveName,maxSizeBytes:maxSizeBytes,earliestRestoreDate:earliestRestoreDate}" \
  --output table
```

Confirm:

- Status is `Online`.
- Tier is intentional.
- Earliest restore date is populated.
- Storage limit is adequate.

### 9.2 Point-in-time restore

Azure SQL provides automated backups for point-in-time restore. Verify the configured short-term retention:

```bash
az sql db str-policy show \
  --resource-group "$RG" \
  --server "$SQL" \
  --database "$DB" \
  --output table
```

Record:

- Retention days.
- Differential backup interval where applicable.

Do not reduce retention solely to save cost without explicit approval.

### 9.3 Long-term retention

Check:

```bash
az sql db ltr-policy show \
  --resource-group "$RG" \
  --server "$SQL" \
  --database "$DB" \
  --output table
```

Long-term retention is optional for this initial launch. If the business requires monthly/yearly archival, propose a policy and cost impact before enabling it.

### 9.4 Restore test

Before launch, perform at least one restore test to a temporary database.

Example:

```bash
RESTORE_DB="mywifesdumplings-restore-test-$(date +%Y%m%d)"
RESTORE_TIME="<UTC restore time within the valid restore window>"

az sql db restore \
  --resource-group "$RG" \
  --server "$SQL" \
  --name "$DB" \
  --dest-name "$RESTORE_DB" \
  --time "$RESTORE_TIME"
```

Creating a restored database is billable. Obtain approval first.

Verify the restored database, then delete it after approval:

```bash
az sql db delete \
  --resource-group "$RG" \
  --server "$SQL" \
  --name "$RESTORE_DB" \
  --yes
```

### 9.5 Firewall inventory

```bash
az sql server firewall-rule list \
  --resource-group "$RG" \
  --server "$SQL" \
  --query "[].{name:name,startIp:startIpAddress,endIp:endIpAddress}" \
  --output table
```

Get App Service outbound addresses:

```bash
az webapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "{current:outboundIpAddresses,possible:possibleOutboundIpAddresses}" \
  --output json
```

### 9.6 Firewall acceptance rules

The SQL firewall should:

- Permit the App Service outbound IP addresses required for production.
- Avoid broad developer/home IP access unless temporarily required.
- Avoid `0.0.0.0` to `0.0.0.0` unless the team explicitly accepts the “Allow Azure services” exposure.
- Contain clearly named rules.
- Remove obsolete temporary setup rules after approval.

Do not remove a firewall rule until its purpose and current usage are understood.

If the App Service plan changes or scales, re-check possible outbound IP addresses.

### 9.7 Database security checks

- SQL administrator password is stored securely.
- Connection string exists only in Key Vault.
- Public network access is intentionally configured.
- TLS encryption is required by the connection string.
- `TrustServerCertificate=False`.
- No connection string is committed to Git.
- The App Service can connect after firewall changes.
- The admin dashboard and order creation still work.

Official references:

- [Azure SQL automated backups](https://learn.microsoft.com/azure/azure-sql/database/automated-backups-overview)
- [Configure backup retention](https://learn.microsoft.com/azure/azure-sql/database/automated-backups-change-settings)
- [Azure SQL firewall rules](https://learn.microsoft.com/azure/azure-sql/database/firewall-configure)

## 10. Replace temporary administrator credentials

### 10.1 Identify whether rotation is required

Rotate the administrator credentials if:

- The current password was created for setup/testing.
- The password was shared in chat, email, screenshots, or plain text.
- The password is not stored in a password manager.
- The email is not the intended long-term owner account.
- There is uncertainty about who knows the password.

### 10.2 Preferred rotation flow

Use the implemented admin dashboard password-change feature:

1. Sign in as the administrator.
2. Open **Change password**.
3. Enter the current password.
4. Generate a unique password of at least 16 characters in a password manager.
5. Enter and confirm the new password.
6. Submit.
7. Confirm the current session is invalidated.
8. Confirm the old password no longer works.
9. Confirm the new password works.

Changing the live administrator password requires explicit approval at action time.

### 10.3 Synchronize the recovery seed

`Seed--AdminPassword` creates the administrator only when the account does not exist. It does not reset an existing password.

After a successful password change, update the Key Vault seed so disaster recovery does not retain an obsolete temporary password:

```bash
read -s -p "New administrator password: " ADMIN_PASSWORD
echo

az keyvault secret set \
  --vault-name "$VAULT" \
  --name "Seed--AdminPassword" \
  --value "$ADMIN_PASSWORD"

unset ADMIN_PASSWORD
```

Do not paste the password directly into a command or chat.

If changing the administrator email, update:

```text
Seed--AdminEmail
```

Updating the seed email does not rename an existing Identity user. Email changes require an explicit account migration plan and must not be attempted by editing database rows manually.

### 10.4 Credential verification

- New password works.
- Old password fails.
- Admin role remains assigned.
- Admin dashboard loads.
- Password exists in the owner's password manager.
- No credential is present in shell history.
- Key Vault secret names exist and are enabled.
- No password value is printed during verification.

## 11. Completion record template

Create a dated copy outside source control if it contains operational details not suitable for the repository.

```markdown
# Production Readiness Record

Date:
Operator:
Approver:

## Data cleanup

- Pre-cleanup restore point recorded:
- Backup/copy created:
- Approved order IDs removed:
- Approved customer accounts removed:
- Administrator preserved and verified:

## Sanity

- Menu items reviewed:
- Pricing tiers reviewed:
- Extras reviewed:
- Published content verified:
- Stripe test amount matched:

## Monitoring

- Application Insights resource:
- Telemetry verified:
- Availability test:
- Alert rules:
- Action group test received:

## Budget

- Scope:
- Monthly amount:
- Alert thresholds:
- Notification recipient:

## Azure SQL

- Service tier:
- Short-term retention:
- Long-term retention:
- Restore test:
- Firewall rules reviewed:
- Temporary rules removed:

## Administrator

- Credentials rotated:
- Old password rejected:
- New password verified:
- Key Vault seed synchronized:

## Final checks

- API health:
- Frontend:
- Admin dashboard:
- Test order:
- Stripe webhook:
- Confirmation email:

Residual risks:
```

## 12. Final launch checklist

### Data

- [ ] Production data inventory reviewed.
- [ ] Restore point recorded before cleanup.
- [ ] Test orders removed with explicit approval.
- [ ] Test customer accounts removed with explicit approval.
- [ ] Administrator and roles preserved.

### Sanity

- [ ] Real menu items are accurate and published.
- [ ] Real NZD prices are approved.
- [ ] Extras and bundled inclusions are accurate.
- [ ] Unavailable products are disabled.
- [ ] Sanity document IDs were preserved.
- [ ] Test Stripe amount matches server-side Sanity pricing.

### Monitoring

- [ ] Application Insights receives production telemetry.
- [ ] API availability test is green.
- [ ] Server-error alert exists.
- [ ] Exception alert exists.
- [ ] SQL dependency failure alert exists.
- [ ] Action group test notification was received.
- [ ] Ingestion limits and retention were reviewed.

### Cost

- [ ] Azure monthly budget exists.
- [ ] 50%, 75%, 90%, and 100% notifications exist.
- [ ] Notification recipient is correct.
- [ ] Student credit and expiration are understood.

### Database

- [ ] Database is online.
- [ ] Point-in-time restore window is recorded.
- [ ] Backup retention is intentional.
- [ ] Restore test passed or is scheduled with approval.
- [ ] Firewall rules are least-privilege.
- [ ] App Service connectivity works after firewall review.

### Administrator

- [ ] Permanent administrator email is correct.
- [ ] Temporary password was replaced if necessary.
- [ ] Password is stored in a password manager.
- [ ] Old password no longer works.
- [ ] Key Vault seed is synchronized.
- [ ] Admin dashboard login and order management work.

## 13. Definition of done

Production readiness is complete when:

- No unapproved test orders or test customer accounts remain.
- Sanity contains the approved real menu and prices.
- Server-side price verification passes against Stripe test mode.
- Application Insights telemetry and operational alerts are active.
- An Azure budget and notifications are configured.
- Azure SQL backup, restore, and firewall settings are understood and documented.
- Permanent administrator credentials are secured and verified.
- The completion record is filled out.
- No destructive, billable, or credential-changing action occurred without explicit approval.
