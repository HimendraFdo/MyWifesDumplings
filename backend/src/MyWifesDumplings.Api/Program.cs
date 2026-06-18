using System.Text;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyWifesDumplings.Api.Auth;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Email;
using MyWifesDumplings.Api.Endpoints;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Orders;
using MyWifesDumplings.Api.Payments;
using MyWifesDumplings.Api.Pricing;

var builder = WebApplication.CreateBuilder(args);

// --- Secrets: Azure Key Vault (WP-7) — CONDITIONAL, must never break local dev. ---
// Added as a configuration source ONLY when a vault URI is configured (config key "KeyVault:Uri"
// or env "KEYVAULT__URI"). In Azure the App Service's Managed Identity authenticates via
// DefaultAzureCredential; locally a developer's az/VS credentials are used IF a vault is set.
// When no vault URI is present the app composes and runs exactly as before, sourcing config from
// appsettings + user-secrets — so local dev requires no Azure at all.
//
// Key Vault secret names use "--" as the section separator, which maps to ":" in config, e.g.
//   ConnectionStrings--Default        -> ConnectionStrings:Default
//   Stripe--SecretKey                 -> Stripe:SecretKey
//   Stripe--WebhookSecret             -> Stripe:WebhookSecret
//   Resend--ApiKey                    -> Resend:ApiKey
//   Jwt--SigningKey                   -> Jwt:SigningKey
//   ApplicationInsights--ConnectionString -> ApplicationInsights:ConnectionString
var keyVaultUri = builder.Configuration["KeyVault:Uri"];
if (!string.IsNullOrWhiteSpace(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());
}

// --- Observability: Application Insights (no-op locally if no connection string) ---
builder.Services.AddApplicationInsightsTelemetry();

// --- Database: EF Core + Azure SQL ---
// Connection string resolved from config / Key Vault (see appsettings.json "ConnectionStrings:Default").
// Entities are added in WP-2; this wires the context so the app can connect.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// --- Identity: users + roles stored in the same Azure SQL DB via AppDbContext. ---
// JWT issuance and role-based authorization policies are wired in WP-3; WP-2 only needs the
// Identity stores registered so roles + an admin user can be seeded.
builder.Services.AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// --- Auth (WP-3): JWT bearer authentication + role-based authorization. ---
// JWT settings (Issuer/Audience/SigningKey/Expiry) bind from the "Jwt" config section. The dev
// signing key is a clearly-marked placeholder in appsettings.Development.json; the production key
// comes from Key Vault (WP-7). No real secret is committed.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddScoped<ITokenService, TokenService>();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
          ?? new JwtOptions();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// --- Orders core (WP-4): server-side pricing + Stripe PaymentIntent creation. ---
// Sanity stays the menu source of truth (§1/§12): prices come from a price provider, NOT a SQL table.
builder.Services.Configure<SanityOptions>(builder.Configuration.GetSection(SanityOptions.SectionName));
builder.Services.Configure<StripeOptions>(builder.Configuration.GetSection(StripeOptions.SectionName));
// Bound StripeOptions resolvable directly (endpoint reads Currency without IOptions ceremony).
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<StripeOptions>>().Value);

var sanityOptions = builder.Configuration.GetSection(SanityOptions.SectionName).Get<SanityOptions>()
                    ?? new SanityOptions();

if (sanityOptions.IsConfigured)
{
    // Production / configured path: real Sanity-backed provider over HttpClient.
    builder.Services.AddHttpClient<IMenuPriceProvider, SanityMenuPriceProvider>();
}
else if (builder.Environment.IsDevelopment())
{
    // DEV-ONLY fallback so the app composes and tests run without Sanity creds.
    // Never selected in production: a non-Development env with unconfigured Sanity fails fast below.
    builder.Services.AddSingleton<IMenuPriceProvider, StubMenuPriceProvider>();
}
else
{
    throw new InvalidOperationException(
        "Sanity is not configured (Sanity:ProjectId / Sanity:Dataset). The dev stub price provider " +
        "is Development-only and must never be the production default. Supply Sanity config via Key Vault.");
}

// Stripe PaymentIntent creation (create only — confirmation is the WP-5 webhook).
builder.Services.AddScoped<IPaymentIntentService, StripePaymentIntentService>();

// Pure pricing/order-building logic (testable without DB/Stripe/network).
builder.Services.AddScoped<OrderCreationService>();

// --- Order read/admin services (WP-6): list/scope queries + status transitions over AppDbContext. ---
// Authorization-independent; the endpoints pass the caller identity and apply the role attributes.
builder.Services.AddScoped<OrderQueryService>();
builder.Services.AddScoped<OrderAdminService>();

// --- Payment confirmation (WP-5): Stripe webhook + confirmation email (§5/§7/§8). ---
// The verified webhook is the SINGLE source of truth for payment state; the service updates the
// order via AppDbContext and is registered scoped to match the DbContext lifetime.
builder.Services.AddScoped<StripeWebhookService>();

// Confirmation email seam (Resend). Mirrors the Sanity provider pattern above: real Resend service
// when configured; a Development-only no-op when not; fail fast in any other environment.
builder.Services.Configure<ResendOptions>(builder.Configuration.GetSection(ResendOptions.SectionName));
var resendOptions = builder.Configuration.GetSection(ResendOptions.SectionName).Get<ResendOptions>()
                    ?? new ResendOptions();

if (resendOptions.IsConfigured)
{
    // Production / configured path: real Resend-backed service over HttpClient.
    builder.Services.AddHttpClient<IOrderEmailService, ResendOrderEmailService>();
}
else if (builder.Environment.IsDevelopment())
{
    // DEV-ONLY fallback so the app composes and the webhook path runs without Resend creds.
    // Never selected in production: a non-Development env with unconfigured Resend fails fast below.
    builder.Services.AddSingleton<IOrderEmailService, NoOpOrderEmailService>();
}
else
{
    throw new InvalidOperationException(
        "Resend is not configured (Resend:ApiKey). The dev no-op email service is Development-only and " +
        "must never be the production default. Supply Resend:ApiKey via Key Vault.");
}

// --- CORS: locked to the frontend origin(s) (the Vercel domain). ---
// Configure allowed origins in appsettings ("Cors:AllowedOrigins"). The API is cross-origin
// from the Next.js frontend, so this must list the production Vercel URL.
const string FrontendCors = "FrontendCors";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// --- OpenAPI / Swagger (dev only) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Schema + seed on startup (WP-7 migration-on-deploy strategy). ---
// Migrations are applied at startup via Database.Migrate() ONLY when a connection string is present.
// Migrate() is non-destructive: it applies pending migration files (idempotent — already-applied
// migrations are skipped) and never drops data. With no connection string (local dev with no DB),
// migration is skipped; the idempotent DbSeeder still runs and stops at its SQL step — the expected
// local behavior. Do NOT add a connection string here to force it.
using (var scope = app.Services.CreateScope())
{
    var hasConnectionString =
        !string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("Default"));
    if (hasConnectionString)
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(FrontendCors);

// Authentication must run before authorization, and both after CORS / before endpoints (WP-3).
app.UseAuthentication();
app.UseAuthorization();

// --- Health check: used by App Service / monitoring and the WP-1 acceptance criteria. ---
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .WithName("Health")
   .WithOpenApi();

// --- Auth endpoints (WP-3): register (Customer) + login (JWT). ---
app.MapAuthEndpoints();

// --- Orders core (WP-4): POST /api/orders (public; guest + account share one path). ---
app.MapOrderEndpoints();

// --- Stripe webhook (WP-5): POST /api/webhooks/stripe (public, signature-verified; sole payment-state writer). ---
app.MapWebhookEndpoints();

// --- Order read/status surface (WP-6): admin list + status PATCH, customer "my orders", guest lookup. ---
// Replaces the temporary WP-3 admin probe (GET /api/admin/ping), which has been removed.
app.MapOrderQueryEndpoints();

app.Run();
