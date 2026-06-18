using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Orders;

/// <summary>
/// Read-side order queries (WP-6, spec §8). All authorization-independent query/scoping logic lives
/// here so it is unit-testable with EF Core InMemory; the endpoints apply the [Authorize] attributes
/// and pass the caller's identity (the JWT subject) in as a parameter — never from a client field.
///
/// SECURITY (spec §12):
///  - <see cref="GetForUserAsync"/> filters STRICTLY by <c>UserId == callerId</c> (no IDOR — a caller
///    can never see another user's or a guest's orders).
///  - <see cref="GetByLookupTokenAsync"/> matches a single order by its secret token only; there is no
///    enumeration surface and the token is never echoed back in the response.
/// </summary>
public sealed class OrderQueryService
{
    private readonly AppDbContext _db;

    public OrderQueryService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Admin list: all orders, optionally narrowed to a single <paramref name="status"/>. Null =>
    /// every order. Newest first.
    /// </summary>
    public async Task<IReadOnlyList<OrderSummaryResponse>> GetAllAsync(
        OrderStatus? status, CancellationToken ct)
    {
        var query = BaseQuery();
        if (status is not null)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var orders = await query.ToListAsync(ct);
        return orders.Select(OrderSummaryResponse.FromOrder).ToList();
    }

    /// <summary>
    /// "My orders": ONLY the calling user's orders, identified by the JWT subject. Returns empty for a
    /// null/blank caller id rather than leaking anything. Newest first.
    /// </summary>
    public async Task<IReadOnlyList<OrderSummaryResponse>> GetForUserAsync(
        string? callerUserId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(callerUserId))
        {
            return Array.Empty<OrderSummaryResponse>();
        }

        var orders = await BaseQuery()
            .Where(o => o.UserId == callerUserId)
            .ToListAsync(ct);
        return orders.Select(OrderSummaryResponse.FromOrder).ToList();
    }

    /// <summary>
    /// Guest lookup: the single order whose <c>GuestLookupToken</c> equals <paramref name="token"/>,
    /// or null if none. The token is the only credential; nothing else is required and no list is
    /// exposed.
    /// </summary>
    public async Task<OrderSummaryResponse?> GetByLookupTokenAsync(string? token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var order = await BaseQuery()
            .FirstOrDefaultAsync(o => o.GuestLookupToken == token, ct);
        return order is null ? null : OrderSummaryResponse.FromOrder(order);
    }

    /// <summary>Shared base query: items eager-loaded, newest first, read-only (no tracking).</summary>
    private IQueryable<Order> BaseQuery() =>
        _db.Orders
            .AsNoTracking()
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.CreatedAt)
            .ThenByDescending(o => o.Id);
}
