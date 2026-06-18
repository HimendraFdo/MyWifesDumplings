using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using MyWifesDumplings.Api.Auth;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Endpoints;

/// <summary>
/// Public authentication endpoints (§8): register a Customer and log in to receive a JWT.
/// </summary>
public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/register (Public) — always assigns the Customer role (§4). Never admin.
        group.MapPost("/register", async (
            RegisterRequest request,
            UserManager<ApplicationUser> userManager) =>
        {
            if (!TryValidate(request, out var validationErrors))
            {
                return Results.ValidationProblem(validationErrors);
            }

            var existing = await userManager.FindByEmailAsync(request.Email);
            if (existing is not null)
            {
                return Results.Conflict(new { error = "A user with that email already exists." });
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email
            };

            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return Results.ValidationProblem(ToErrorDictionary(createResult));
            }

            // Default role on signup is Customer (§4) — registration never grants Admin.
            await userManager.AddToRoleAsync(user, DbSeeder.CustomerRole);

            return Results.Created($"/api/auth/users/{user.Id}",
                new { user.Id, user.Email, Role = DbSeeder.CustomerRole });
        })
        .WithName("Register")
        .WithOpenApi();

        // POST /api/auth/login (Public) — verify credentials, issue a JWT, 401 on bad creds.
        group.MapPost("/login", async (
            LoginRequest request,
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService) =>
        {
            if (!TryValidate(request, out var validationErrors))
            {
                return Results.ValidationProblem(validationErrors);
            }

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            {
                // Same response whether the user is missing or the password is wrong (no enumeration).
                return Results.Unauthorized();
            }

            var roles = await userManager.GetRolesAsync(user);
            var (token, expiresAtUtc) = tokenService.CreateToken(user, roles);

            return Results.Ok(new AuthResponse(token, expiresAtUtc, user.Email!, roles.ToArray()));
        })
        .WithName("Login")
        .WithOpenApi();

        return app;
    }

    private static bool TryValidate(
        object request, out Dictionary<string, string[]> errors)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        errors = new Dictionary<string, string[]>();

        if (Validator.TryValidateObject(request, context, results, validateAllProperties: true))
        {
            return true;
        }

        errors = results
            .SelectMany(r => r.MemberNames.DefaultIfEmpty(string.Empty)
                .Select(m => (Member: m, r.ErrorMessage)))
            .GroupBy(x => x.Member)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.ErrorMessage ?? "Invalid value.").ToArray());
        return false;
    }

    private static Dictionary<string, string[]> ToErrorDictionary(IdentityResult result) =>
        result.Errors
            .GroupBy(e => e.Code)
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
}
