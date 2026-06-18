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
    IReadOnlyList<OrderLineSummary> Items)
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
            lines);
    }
}

/// <summary>Body of <c>PATCH /api/orders/{id}/status</c>: the target lifecycle status (spec §7/§8).</summary>
public sealed record UpdateOrderStatusRequest(OrderStatus Status);
