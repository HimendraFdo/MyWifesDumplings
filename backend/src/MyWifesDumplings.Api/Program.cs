using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyWifesDumplings.Api.Auth;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Endpoints;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Orders;
using MyWifesDumplings.Api.Payments;
using MyWifesDumplings.Api.Pricing;

var builder = WebApplication.CreateBuilder(args);

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

// --- Idempotent seed: ensure Customer/Admin roles + one Admin user exist (spec §10 WP-2). ---
using (var scope = app.Services.CreateScope())
{
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

// --- Admin probe (WP-3 verification only; replaced by real admin endpoints in WP-6). ---
app.MapAdminProbeEndpoints();

app.Run();
