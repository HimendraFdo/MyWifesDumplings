using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Orders;
using Xunit;

namespace MyWifesDumplings.Api.Tests;

/// <summary>
/// WP-6 status-transition acceptance criteria (spec §5/§7/§8) over EF Core InMemory:
///   - a PAID order transitions and only Status changes (PaidAt is never mutated);
///   - an invalid/undefined enum value is rejected (400-equivalent);
///   - an unknown id is a 404-equivalent;
///   - an UNPAID order is rejected (payment state remains webhook-sourced; nothing is mutated).
/// </summary>
public class OrderAdminServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"orderadmin-tests-{Guid.NewGuid()}")
            .Options);

    private static Order SeedOrder(AppDbContext db, bool paid, OrderStatus status = OrderStatus.NotStarted)
    {
        var order = new Order
        {
            CustomerEmail = "a@x.com",
            GuestLookupToken = "tok",
            Status = status,
            PaidAt = paid ? DateTime.UtcNow : null,
            StripePaymentIntentId = paid ? "pi_1" : null,
        };
        order.OrderItems.Add(new OrderItem
        {
            MenuItemId = "pork", NameSnapshot = "Pork", UnitPriceSnapshot = 10m, Quantity = 2,
        });
        db.Orders.Add(order);
        db.SaveChanges();
        return order;
    }

    [Fact]
    public async Task PaidOrder_Transitions_AndOnlyStatusChanges()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: true, status: OrderStatus.NotStarted);
        var paidAtBefore = order.PaidAt;
        var intentBefore = order.StripePaymentIntentId;

        var result = await new OrderAdminService(db)
            .UpdateStatusAsync(order.Id, OrderStatus.Ongoing, CancellationToken.None);

        Assert.Equal(StatusUpdateOutcome.Updated, result.Outcome);
        Assert.Equal("Ongoing", result.Order!.Status);

        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.Ongoing, reloaded.Status);
        // Payment state is untouched (spec §5).
        Assert.Equal(paidAtBefore, reloaded.PaidAt);
        Assert.Equal(intentBefore, reloaded.StripePaymentIntentId);
    }

    [Fact]
    public async Task InvalidEnumValue_IsRejected_AndNothingMutated()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: true, status: OrderStatus.NotStarted);

        var result = await new OrderAdminService(db)
            .UpdateStatusAsync(order.Id, (OrderStatus)99, CancellationToken.None);

        Assert.Equal(StatusUpdateOutcome.InvalidStatus, result.Outcome);
        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.NotStarted, reloaded.Status);
    }

    [Fact]
    public async Task UnknownId_IsNotFound()
    {
        using var db = NewDb();
        SeedOrder(db, paid: true);

        var result = await new OrderAdminService(db)
            .UpdateStatusAsync(99999, OrderStatus.Completed, CancellationToken.None);

        Assert.Equal(StatusUpdateOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task UnpaidOrder_IsRejected_AndStatusUnchanged()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: false, status: OrderStatus.NotStarted);

        var result = await new OrderAdminService(db)
            .UpdateStatusAsync(order.Id, OrderStatus.Ongoing, CancellationToken.None);

        Assert.Equal(StatusUpdateOutcome.NotPaid, result.Outcome);
        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.NotStarted, reloaded.Status);
        Assert.Null(reloaded.PaidAt);
    }

    [Fact]
    public async Task PatchNeverStampsPayment_OnAnUnpaidOrder()
    {
        // Defence-in-depth: even the rejected path must leave PaidAt null (payment is webhook-only).
        using var db = NewDb();
        var order = SeedOrder(db, paid: false);

        await new OrderAdminService(db)
            .UpdateStatusAsync(order.Id, OrderStatus.Completed, CancellationToken.None);

        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Null(reloaded.PaidAt);
        Assert.Null(reloaded.StripePaymentIntentId);
    }
}
