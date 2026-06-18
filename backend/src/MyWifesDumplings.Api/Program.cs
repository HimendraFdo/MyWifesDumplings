using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyWifesDumplings.Api.Auth;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Endpoints;
using MyWifesDumplings.Api.Entities;

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

// --- Admin probe (WP-3 verification only; replaced by real admin endpoints in WP-6). ---
app.MapAdminProbeEndpoints();

app.Run();
