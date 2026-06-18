using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
            OrderQueryService orders,
            CancellationToken ct) =>
        {
            if (!TryParseStatusFilter(status, out var filter))
            {
                return Results.BadRequest(new { error = $"Unknown order status '{status}'." });
            }

            var result = await orders.GetAllAsync(filter, ct);
            return Results.Ok(result);
        })
        .WithName("AdminListOrders")
        .WithTags("Admin")
        .WithOpenApi();

        // --- Admin: transition an order's status (spec §5/§7/§8). Changes ONLY Status. ---
        app.MapPatch("/api/orders/{id:int}/status", [Authorize(Roles = "Admin")] async (
            int id,
            UpdateOrderStatusRequest request,
            OrderAdminService admin,
            CancellationToken ct) =>
        {
            var result = await admin.UpdateStatusAsync(id, request.Status, ct);
            return result.Outcome switch
            {
                StatusUpdateOutcome.Updated => Results.Ok(result.Order),
                StatusUpdateOutcome.InvalidStatus => Results.BadRequest(
                    new { error = $"'{(int)request.Status}' is not a valid order status." }),
                StatusUpdateOutcome.NotFound => Results.NotFound(
                    new { error = $"Order {id} was not found." }),
                StatusUpdateOutcome.NotPaid => Results.Conflict(
                    new { error = "Order is not paid yet; its status cannot be changed until payment is confirmed." }),
                _ => Results.Problem("Unexpected status-update outcome."),
            };
        })
        .WithName("AdminUpdateOrderStatus")
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

    /// <summary>
    /// Parses the optional <c>?status=</c> filter. Null/blank => no filter (all orders). A defined enum
    /// name (case-insensitive) => that status. Anything else => false (the endpoint returns 400).
    /// Numeric strings are rejected so the filter is restricted to the documented enum names.
    /// </summary>
    private static bool TryParseStatusFilter(string? status, out OrderStatus? filter)
    {
        filter = null;
        if (string.IsNullOrWhiteSpace(status))
        {
            return true;
        }

        // Reject numeric input ("1") and only accept the named values (NotStarted/Ongoing/Completed).
        if (int.TryParse(status, out _))
        {
            return false;
        }

        if (Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsed)
            && Enum.IsDefined(typeof(OrderStatus), parsed))
        {
            filter = parsed;
            return true;
        }

        return false;
    }
}
