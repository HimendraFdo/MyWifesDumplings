using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// --- Observability: Application Insights (no-op locally if no connection string) ---
builder.Services.AddApplicationInsightsTelemetry();

// --- Database: EF Core + Azure SQL ---
// Connection string resolved from config / Key Vault (see appsettings.json "ConnectionStrings:Default").
// Entities are added in WP-2; this wires the context so the app can connect.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(FrontendCors);

// --- Health check: used by App Service / monitoring and the WP-1 acceptance criteria. ---
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .WithName("Health")
   .WithOpenApi();

app.Run();
