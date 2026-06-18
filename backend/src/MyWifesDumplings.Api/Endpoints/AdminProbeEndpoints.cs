using Microsoft.AspNetCore.Authorization;

namespace MyWifesDumplings.Api.Endpoints;

/// <summary>
/// WP-3 VERIFICATION PROBE ONLY. A single Admin-guarded endpoint so the acceptance criterion
/// "Admin-only endpoint rejects non-admins (403)" is testable. The real admin order endpoints
/// (GET /api/admin/orders, PATCH /api/orders/{id}/status) arrive in WP-6 and should replace this.
/// </summary>
public static class AdminProbeEndpoints
{
    public static IEndpointRouteBuilder MapAdminProbeEndpoints(this IEndpointRouteBuilder app)
    {
        // Requires a valid JWT carrying the Admin role claim. Anonymous => 401; non-admin => 403.
        app.MapGet("/api/admin/ping", [Authorize(Roles = "Admin")] () =>
                Results.Ok(new { status = "admin-ok" }))
            .WithName("AdminPing")
            .WithTags("Admin (WP-3 probe)")
            .WithOpenApi();

        return app;
    }
}
