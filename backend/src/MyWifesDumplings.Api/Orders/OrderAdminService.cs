using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Orders;

/// <summary>The outcome of an admin status-transition attempt, mapped to an HTTP status by the endpoint.</summary>
public enum StatusUpdateOutcome
{
    /// <summary>Status was updated and persisted.</summary>
    Updated,
    /// <summary>The target value was not a defined <see cref="OrderStatus"/> (=> 400).</summary>
    InvalidStatus,
    /// <summary>No order with the given id exists (=> 404).</summary>
    NotFound,
    /// <summary>The order is not paid yet, so it cannot be transitioned (=> 409).</summary>
    NotPaid,
}

/// <summary>Result of an admin status update; carries the refreshed read model on success.</summary>
public sealed record StatusUpdateResult(StatusUpdateOutcome Outcome, OrderSummaryResponse? Order = null);

/// <summary>
/// Admin write-side logic for order status transitions (WP-6, spec §5/§7/§8). Kept separate from the
/// endpoint so the transition rules are unit-testable with EF Core InMemory.
///
/// INVARIANTS (spec §5):
///  - Updates ONLY <see cref="Order.Status"/>. It never reads or writes <see cref="Order.PaidAt"/> or
///    any other payment state — payment is sourced exclusively from the Stripe webhook (WP-5).
///  - Only PAID orders (PaidAt != null) may be transitioned: an order's lifecycle begins when payment
///    is confirmed (it auto-enters NotStarted then), so an unpaid order has no valid status to move.
/// </summary>
public sealed class OrderAdminService
{
    private readonly AppDbContext _db;

    public OrderAdminService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<StatusUpdateResult> UpdateStatusAsync(
        int orderId, OrderStatus target, CancellationToken ct)
    {
        // Reject undefined enum values (e.g. a raw out-of-range number) before touching the DB.
        if (!Enum.IsDefined(typeof(OrderStatus), target))
        {
            return new StatusUpdateResult(StatusUpdateOutcome.InvalidStatus);
        }

        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order is null)
        {
            return new StatusUpdateResult(StatusUpdateOutcome.NotFound);
        }

        // Guard: payment state comes only from the webhook; an unpaid order is not in the lifecycle.
        if (order.PaidAt is null)
        {
            return new StatusUpdateResult(StatusUpdateOutcome.NotPaid);
        }

        // Update ONLY Status. PaidAt / StripePaymentIntentId are intentionally left untouched.
        order.Status = target;
        await _db.SaveChangesAsync(ct);

        return new StatusUpdateResult(
            StatusUpdateOutcome.Updated, OrderSummaryResponse.FromOrder(order));
    }
}
