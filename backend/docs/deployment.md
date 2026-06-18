# Deployment & Secrets (WP-7)

How the **My Wife's Dumplings** API reaches Azure, where its secrets live, and what a human must
provision before the first deploy. **No live Azure infra exists yet** — this document is the wiring
and the runbook. Every value below is a **placeholder**; nothing here is a real credential or name.

> Guardrail (§12): **no secrets in the repo.** Stripe keys, the DB connection string, the JWT signing
> key, and the Resend key all come from **Azure Key Vault** in production and from **dotnet
> user-secrets** locally. `appsettings.json` keeps these fields empty by design.

---

## 1. Architecture of secrets

| Environment | Secret source | Auth |
|---|---|---|
| **Local dev** | `dotnet user-secrets` (+ `appsettings.json` for non-secret config) | none — no Azure needed |
| **Azure** | **Azure Key Vault** | App Service **system-assigned Managed Identity** |

Key Vault is added as a configuration source in `Program.cs` **only when `KeyVault:Uri` is set**
(see the conditional block near the top). When it is unset — as in local dev — the app composes and
runs exactly as before from `appsettings` + user-secrets. `DefaultAzureCredential` authenticates: the
App Service Managed Identity in Azure, or a developer's `az login` / Visual Studio credentials locally
(only if a vault URI is configured locally, which is not required).

### Key Vault secret name mapping

Key Vault secret names use `--` as the section separator; the configuration provider maps `--` → `:`.
Create these secrets in the vault:

| Key Vault secret name | Configuration key it populates |
|---|---|
| `ConnectionStrings--Default` | `ConnectionStrings:Default` (Azure SQL connection string) |
| `Stripe--SecretKey` | `Stripe:SecretKey` |
| `Stripe--WebhookSecret` | `Stripe:WebhookSecret` (`whsec_…`) |
| `Resend--ApiKey` | `Resend:ApiKey` |
| `Jwt--SigningKey` | `Jwt:SigningKey` |
| `ApplicationInsights--ConnectionString` | `ApplicationInsights:ConnectionString` |

Also seed the admin user via Key Vault (the idempotent `DbSeeder` reads these at startup):

| Key Vault secret name | Configuration key |
|---|---|
| `Seed--AdminEmail` | `Seed:AdminEmail` |
| `Seed--AdminPassword` | `Seed:AdminPassword` |

---

## 2. Provision Azure (human step, one-time)

Replace every `<…>` placeholder. Do **not** commit the resulting names — keep them in your shell /
GitHub settings only.

```bash
# Variables (placeholders — fill in real values locally, never commit them)
RG=<resource-group>
LOC=<azure-region>                 # e.g. australiaeast
APP=<app-service-name>             # -> GitHub variable AZURE_WEBAPP_NAME
PLAN=<app-service-plan>
VAULT=<key-vault-name>             # -> App setting KeyVault:Uri = https://<VAULT>.vault.azure.net/
SQL=<sql-server-name>
DB=<sql-database-name>

# 1. Key Vault
az keyvault create --name "$VAULT" --resource-group "$RG" --location "$LOC"

# 2. App Service (Linux, .NET 8, no container) + system-assigned Managed Identity
az appservice plan create --name "$PLAN" --resource-group "$RG" --sku B1 --is-linux
az webapp create --name "$APP" --resource-group "$RG" --plan "$PLAN" --runtime "DOTNETCORE:8.0"
az webapp identity assign --name "$APP" --resource-group "$RG"     # note the printed principalId

# 3. Grant the App Service identity get/list on secrets
PRINCIPAL_ID=$(az webapp identity show --name "$APP" --resource-group "$RG" --query principalId -o tsv)
# RBAC vaults: assign "Key Vault Secrets User"
az role assignment create --assignee "$PRINCIPAL_ID" \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show --name "$VAULT" --query id -o tsv)
# (Access-policy vaults instead: az keyvault set-policy --name "$VAULT" \
#    --object-id "$PRINCIPAL_ID" --secret-permissions get list)

# 4. Store secrets (use your REAL values — these are placeholders)
az keyvault secret set --vault-name "$VAULT" --name "ConnectionStrings--Default"          --value "<azure-sql-connection-string>"
az keyvault secret set --vault-name "$VAULT" --name "Stripe--SecretKey"                    --value "<sk_live_…>"
az keyvault secret set --vault-name "$VAULT" --name "Stripe--WebhookSecret"                --value "<whsec_…>"
az keyvault secret set --vault-name "$VAULT" --name "Resend--ApiKey"                        --value "<re_…>"
az keyvault secret set --vault-name "$VAULT" --name "Jwt--SigningKey"                       --value "<long-random-key>"
az keyvault secret set --vault-name "$VAULT" --name "ApplicationInsights--ConnectionString" --value "<appinsights-conn-string>"
az keyvault secret set --vault-name "$VAULT" --name "Seed--AdminEmail"                      --value "<owner-email>"
az keyvault secret set --vault-name "$VAULT" --name "Seed--AdminPassword"                   --value "<strong-password>"
```

---

## 3. App Service application settings

Set these in **Configuration → Application settings** (these are non-secret pointers; the secrets
themselves stay in Key Vault):

| App setting | Value |
|---|---|
| `KeyVault__Uri` | `https://<key-vault-name>.vault.azure.net/` |
| `Cors__AllowedOrigins__0` | **the production Vercel domain** (see §5 below) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

`ApplicationInsights:ConnectionString` flows from Key Vault (above); no App Insights app setting is
needed beyond that. The connection string / Stripe / Resend / JWT values are **not** set here — they
resolve from Key Vault.

---

## 4. GitHub Actions — required secrets & variables

The workflow is [`.github/workflows/backend-deploy.yml`](../../.github/workflows/backend-deploy.yml).
It builds, tests, publishes, then deploys via `azure/webapps-deploy` using **OIDC federated
credentials** (no publish profile, no long-lived secret). Configure these in the repo settings under
**Settings → Secrets and variables → Actions**:

**Secrets** (Settings → Secrets):

| Name | Purpose |
|---|---|
| `AZURE_CLIENT_ID` | App registration (federated credential) client id |
| `AZURE_TENANT_ID` | Azure AD tenant id |
| `AZURE_SUBSCRIPTION_ID` | Target subscription id |

**Variables** (Settings → Variables):

| Name | Purpose |
|---|---|
| `AZURE_WEBAPP_NAME` | The App Service name to deploy to |
| `AZURE_DEPLOY_ENABLED` | Set to `true` only after all Azure OIDC and App Service settings are configured |

Until `AZURE_DEPLOY_ENABLED` is set to `true`, the workflow still builds and tests the backend but
skips the deployment job.

Set up the federated credential on the app registration so GitHub's OIDC token is trusted, e.g. for
the `production` environment / the `main` branch:

```bash
az ad app federated-credential create --id <app-registration-id> --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<org>/<repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

Grant the app registration's service principal `Contributor` (or a tighter custom role) on the
App Service so `webapps-deploy` can push the package.

---

## 5. CORS — production Vercel domain (REQUIRED pre-deploy value)

§12 requires CORS locked to the production Vercel domain. The repo ships a placeholder
(`http://localhost:3000` in `appsettings.json`). **The real production domain is not yet known** and
must NOT be guessed. Before the first deploy, set it as an App Service setting:

```
Cors__AllowedOrigins__0 = https://<the-real-vercel-domain>
```

⚠️ **This is a required pre-deploy value.** Until it is set, browser requests from the production
frontend will be blocked by CORS.

---

## 6. Database migrations on deploy

**Active mechanism: guarded startup migration.** On startup `Program.cs` calls
`AppDbContext.Database.MigrateAsync()` **only when a connection string is present**. `Migrate()` is
non-destructive — it applies pending migration files and skips already-applied ones (idempotent); it
never drops data. The idempotent `DbSeeder` then runs (roles + admin user from the `Seed--*` secrets).

When no connection string is configured (local dev with no DB), migration is skipped — the seeder
reaches its SQL step, which is the expected local behavior.

**Safety net: idempotent SQL script.** The CI workflow also runs
`dotnet ef migrations script --idempotent` and uploads `migrations.sql` as a build artifact. This is
for audit or optional manual DBA application — it is **not** the active mechanism and never touches a
database in CI. If you prefer manual control over schema changes, disable the startup `Migrate()` and
apply `migrations.sql` to Azure SQL by hand instead.

`dotnet ef database update` is **never** run from CI (no live DB at build time).

---

## 7. Values a human must supply before the first deploy

- **Key Vault name** (→ `KeyVault:Uri` app setting).
- **App Service name** (→ GitHub variable `AZURE_WEBAPP_NAME`).
- **Azure OIDC ids** — `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (GitHub secrets),
  plus the federated credential on the app registration.
- **Azure SQL connection string** (→ `ConnectionStrings--Default` secret).
- **Stripe** `SecretKey` + `WebhookSecret` (→ `Stripe--*` secrets).
- **Resend** `ApiKey` (→ `Resend--ApiKey` secret).
- **JWT signing key** (→ `Jwt--SigningKey` secret).
- **App Insights connection string** (→ `ApplicationInsights--ConnectionString` secret).
- **Admin seed** email + password (→ `Seed--*` secrets).
- **Production Vercel domain** (→ `Cors__AllowedOrigins__0` app setting) — see §5.
