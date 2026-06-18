using Microsoft.AspNetCore.Identity;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Data;

/// <summary>
/// Idempotent startup seeding: ensures the <c>Customer</c> and <c>Admin</c> roles exist and that a
/// single <c>Admin</c> user exists. Credentials are read from configuration
/// (<c>Seed:AdminEmail</c> / <c>Seed:AdminPassword</c>) — never hard-coded — so no secret lives in
/// source. Full role-based authorization is WP-3; this only guarantees the roles + admin user exist.
/// </summary>
public static class DbSeeder
{
    public const string CustomerRole = "Customer";
    public const string AdminRole = "Admin";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var config = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        // 1. Ensure roles exist (check-then-create).
        foreach (var role in new[] { CustomerRole, AdminRole })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Seeded role {Role}", role);
            }
        }

        // 2. Ensure the admin user exists. Credentials come from configuration.
        var adminEmail = config["Seed:AdminEmail"];
        var adminPassword = config["Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            logger.LogWarning(
                "Seed:AdminEmail / Seed:AdminPassword not configured; skipping admin user seed.");
            return;
        }

        var existing = await userManager.FindByEmailAsync(adminEmail);
        if (existing is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (!result.Succeeded)
            {
                logger.LogError("Failed to seed admin user: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
                return;
            }

            await userManager.AddToRoleAsync(admin, AdminRole);
            logger.LogInformation("Seeded admin user {Email}", adminEmail);
        }
        else if (!await userManager.IsInRoleAsync(existing, AdminRole))
        {
            // User exists but is missing the Admin role — make the seed self-healing.
            await userManager.AddToRoleAsync(existing, AdminRole);
            logger.LogInformation("Granted Admin role to existing user {Email}", adminEmail);
        }
    }
}
