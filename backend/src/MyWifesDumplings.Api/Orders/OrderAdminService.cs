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
    /// <summary>The requested status is not the next forward lifecycle state (=> 409).</summary>
    InvalidTransition,
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
    private readonly ILogger<OrderAdminService> _logger;

    public OrderAdminService(AppDbContext db, ILogger<OrderAdminService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<StatusUpdateResult> UpdateStatusAsync(
        int orderId,
        OrderStatus target,
        string adminUserId,
        string adminEmail,
        CancellationToken ct)
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

        var expectedTarget = order.Status switch
        {
            OrderStatus.NotStarted => OrderStatus.Ongoing,
            OrderStatus.Ongoing => OrderStatus.Completed,
            _ => (OrderStatus?)null,
        };
        if (expectedTarget != target)
        {
            _logger.LogWarning(
                "Rejected invalid admin order transition for order {OrderId}: {PreviousStatus} to {NewStatus}",
                orderId,
                order.Status,
                target);
            return new StatusUpdateResult(StatusUpdateOutcome.InvalidTransition);
        }

        var previousStatus = order.Status;
        order.Status = target;
        _db.OrderStatusAudits.Add(new OrderStatusAudit
        {
            OrderId = order.Id,
            AdminUserId = adminUserId,
            AdminEmail = adminEmail,
            PreviousStatus = previousStatus,
            NewStatus = target,
            ChangedAtUtc = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Administrator {AdminUserId} changed order {OrderId} status from {PreviousStatus} to {NewStatus}",
            adminUserId,
            orderId,
            previousStatus,
            target);

        return new StatusUpdateResult(
            StatusUpdateOutcome.Updated, OrderSummaryResponse.FromOrder(order));
    }

    public async Task<(bool OrderExists, IReadOnlyList<OrderStatusAuditResponse> Records)>
        GetAuditAsync(int orderId, CancellationToken ct)
    {
        if (!await _db.Orders.AsNoTracking().AnyAsync(o => o.Id == orderId, ct))
        {
            return (false, Array.Empty<OrderStatusAuditResponse>());
        }

        var records = await _db.OrderStatusAudits
            .AsNoTracking()
            .Where(a => a.OrderId == orderId)
            .OrderBy(a => a.ChangedAtUtc)
            .ThenBy(a => a.Id)
            .Select(a => new OrderStatusAuditResponse(
                a.Id,
                a.OrderId,
                a.AdminEmail,
                a.PreviousStatus.ToString(),
                a.NewStatus.ToString(),
                a.ChangedAtUtc))
            .ToListAsync(ct);

        return (true, records);
    }
}
