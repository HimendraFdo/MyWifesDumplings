using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using MyWifesDumplings.Api.Auth;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Orders;

namespace MyWifesDumplings.Api.Endpoints;

/// <summary>
/// WP-6 read/status endpoints (spec §8). Replaces the WP-3 admin probe with the real admin order
/// surface, plus the customer "my orders" history and the public guest lookup:
///
///  - GET   /api/admin/orders          (Admin only)   — list all orders, filterable by ?status=
///  - PATCH /api/orders/{id}/status    (Admin only)   — move an order between lifecycle statuses
///  - GET   /api/me/orders             (authenticated) — the CALLER'S own orders only (no IDOR)
///  - GET   /api/orders/lookup/{token} (public, token) — a single guest order via its secret token
///
/// Authorization is enforced here by attributes/RequireAuthorization; the data scoping (the
/// IDOR-prone part) lives in <see cref="OrderQueryService"/> / <see cref="OrderAdminService"/> and is
/// unit-tested directly.
/// </summary>
public static class OrderQueryEndpoints
{
    public static IEndpointRouteBuilder MapOrderQueryEndpoints(this IEndpointRouteBuilder app)
    {
        // --- Admin: list all orders, optionally filtered by status (spec §8/§12). ---
        // [Authorize(Roles = "Admin")] => anonymous 401, non-admin 403 (same mechanism as the WP-3 probe).
        app.MapGet("/api/admin/orders", [Authorize(Roles = "Admin")] async (
            [FromQuery] string? status,
            [FromQuery] string? search,
            OrderQueryService orders,
            ILogger<OrderQueryService> logger,
            CancellationToken ct) =>
        {
            if (!OrderStatusFilter.TryParse(status, out var filter))
            {
                return Results.BadRequest(new { error = $"Unknown order status '{status}'." });
            }

            try
            {
                var result = await orders.GetAllAsync(filter, search, ct);
                return Results.Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Admin order-list query failed");
                throw;
            }
        })
        .WithName("AdminListOrders")
        .WithTags("Admin")
        .WithOpenApi();

        // --- Admin: transition an order's status (spec §5/§7/§8). Changes ONLY Status. ---
        app.MapPatch("/api/orders/{id:int}/status", [Authorize(Roles = "Admin")] async (
            int id,
            UpdateOrderStatusRequest request,
            ClaimsPrincipal principal,
            OrderAdminService admin,
            CancellationToken ct) =>
        {
            var adminUserId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                              ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? string.Empty;
            var adminEmail = principal.FindFirstValue(JwtRegisteredClaimNames.Email)
                             ?? principal.FindFirstValue(ClaimTypes.Email)
                             ?? string.Empty;
            var result = await admin.UpdateStatusAsync(
                id, request.Status, adminUserId, adminEmail, ct);
            return result.Outcome switch
            {
                StatusUpdateOutcome.Updated => Results.Ok(result.Order),
                StatusUpdateOutcome.InvalidStatus => Results.BadRequest(
                    new { error = $"'{(int)request.Status}' is not a valid order status." }),
                StatusUpdateOutcome.NotFound => Results.NotFound(
                    new { error = $"Order {id} was not found." }),
                StatusUpdateOutcome.NotPaid => Results.Conflict(
                    new { error = "Order is not paid yet; its status cannot be changed until payment is confirmed." }),
                StatusUpdateOutcome.InvalidTransition => Results.Conflict(
                    new { error = "Order status can only move from Not started to Ongoing to Completed." }),
                _ => Results.Problem("Unexpected status-update outcome."),
            };
        })
        .WithName("AdminUpdateOrderStatus")
        .WithTags("Admin")
        .WithOpenApi();

        app.MapGet("/api/admin/orders/{id:int}/audit", [Authorize(Roles = "Admin")] async (
            int id,
            OrderAdminService admin,
            CancellationToken ct) =>
        {
            var result = await admin.GetAuditAsync(id, ct);
            return result.OrderExists
                ? Results.Ok(result.Records)
                : Results.NotFound(new { error = $"Order {id} was not found." });
        })
        .WithName("AdminOrderAudit")
        .WithTags("Admin")
        .WithOpenApi();

        app.MapPost("/api/admin/change-password", [Authorize(Roles = "Admin")] async (
            ChangePasswordRequest request,
            ClaimsPrincipal principal,
            UserManager<ApplicationUser> userManager,
            ILogger<ApplicationUser> logger) =>
        {
            var requiredErrors = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                requiredErrors[nameof(request.CurrentPassword)] = ["The current password is required."];
            if (string.IsNullOrWhiteSpace(request.NewPassword))
                requiredErrors[nameof(request.NewPassword)] = ["The new password is required."];
            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
                requiredErrors[nameof(request.ConfirmPassword)] = ["Password confirmation is required."];
            if (requiredErrors.Count > 0)
            {
                return Results.ValidationProblem(requiredErrors);
            }

            if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.ConfirmPassword)] = ["The new passwords do not match."],
                });
            }

            var userId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                         ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Results.Unauthorized();
            }

            var user = await userManager.FindByIdAsync(userId);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var result = await userManager.ChangePasswordAsync(
                user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var incorrectCurrentPassword =
                    result.Errors.Any(e => e.Code == "PasswordMismatch");
                if (incorrectCurrentPassword)
                {
                    return Results.BadRequest(new { error = "The current password is incorrect." });
                }

                return Results.ValidationProblem(result.Errors
                    .GroupBy(e => e.Code)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));
            }

            logger.LogInformation(
                "Administrator {AdminUserId} changed their password successfully", user.Id);
            return Results.NoContent();
        })
        .WithName("AdminChangePassword")
        .WithTags("Admin")
        .WithOpenApi();

        // --- Customer: the caller's OWN order history (spec §4/§8/§12). Any authenticated user. ---
        // Identity comes strictly from the JWT subject, never from a client-supplied id (no IDOR).
        app.MapGet("/api/me/orders", async (
            ClaimsPrincipal principal,
            OrderQueryService orders,
            CancellationToken ct) =>
        {
            var userId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                         ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

            var result = await orders.GetForUserAsync(userId, ct);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("MyOrders")
        .WithTags("Orders")
        .WithOpenApi();

        // --- Public: guest order lookup by secret token (spec §8). The token is the only credential. ---
        app.MapGet("/api/orders/lookup/{token}", async (
            string token,
            OrderQueryService orders,
            CancellationToken ct) =>
        {
            var result = await orders.GetByLookupTokenAsync(token, ct);
            return result is null
                ? Results.NotFound(new { error = "No order matches that lookup token." })
                : Results.Ok(result);
        })
        .WithName("GuestOrderLookup")
        .WithTags("Orders")
        .WithOpenApi();

        return app;
    }
}
