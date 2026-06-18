using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Orders;

/// <summary>
/// A single line of an order in a read response. Carries the server-stored SNAPSHOT fields plus a
/// server-computed <see cref="LineTotal"/> (UnitPriceSnapshot × Quantity). Never exposes any
/// menu/Sanity state beyond what was snapshotted at order time (spec §6).
/// </summary>
public sealed record OrderLineSummary(
    string MenuItemId,
    string NameSnapshot,
    decimal UnitPriceSnapshot,
    int Quantity,
    decimal LineTotal);

/// <summary>
/// Read model for an order (admin list, "my orders", and guest lookup all share this shape).
///
/// SECURITY (spec §12): this DTO deliberately does NOT include <c>GuestLookupToken</c> — the secret
/// guest credential is never echoed back in any list or detail response. <see cref="Total"/> is
/// computed server-side as Σ(UnitPriceSnapshot × Quantity); the client never supplies a total.
/// </summary>
public sealed record OrderSummaryResponse(
    int Id,
    string CustomerEmail,
    string Status,
    bool IsPaid,
    DateTime? PaidAt,
    DateTime CreatedAt,
    decimal Total,
    IReadOnlyList<OrderLineSummary> Items,
    string? Flavour)
{
    /// <summary>Projects an <see cref="Order"/> (with its items loaded) into the read model.</summary>
    public static OrderSummaryResponse FromOrder(Order order)
    {
        var lines = order.OrderItems
            .Select(i => new OrderLineSummary(
                i.MenuItemId,
                i.NameSnapshot,
                i.UnitPriceSnapshot,
                i.Quantity,
                i.UnitPriceSnapshot * i.Quantity))
            .ToList();

        return new OrderSummaryResponse(
            order.Id,
            order.CustomerEmail,
            order.Status.ToString(),
            order.PaidAt is not null,
            order.PaidAt,
            order.CreatedAt,
            lines.Sum(l => l.LineTotal),
            lines,
            order.Flavour);
    }
}

/// <summary>Body of <c>PATCH /api/orders/{id}/status</c>: the target lifecycle status (spec §7/§8).</summary>
public sealed record UpdateOrderStatusRequest(OrderStatus Status);

/// <summary>
/// Parses the optional <c>?status=</c> filter for the admin order list (spec §8). Extracted from the
/// endpoint so the accept/reject rules are unit-testable without spinning up the HTTP pipeline.
/// </summary>
public static class OrderStatusFilter
{
    /// <summary>
    /// Null/blank => no filter (<paramref name="filter"/> is null, returns true => all orders). A defined
    /// enum name (case-insensitive, e.g. <c>Ongoing</c>) OR a defined numeric value (e.g. <c>1</c>) =>
    /// that status. An unknown name or an out-of-range number (e.g. <c>99</c>) => false (the endpoint
    /// returns 400). <see cref="Enum.TryParse{T}(string, bool, out T)"/> accepts any integer, so the
    /// <see cref="Enum.IsDefined"/> check is what keeps the filter to the documented values.
    /// </summary>
    public static bool TryParse(string? status, out OrderStatus? filter)
    {
        filter = null;
        if (string.IsNullOrWhiteSpace(status))
        {
            return true;
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
