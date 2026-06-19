using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
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
    private static OrderAdminService Service(AppDbContext db) =>
        new(db, NullLogger<OrderAdminService>.Instance);

    private static Task<StatusUpdateResult> Update(
        AppDbContext db,
        int orderId,
        OrderStatus status) =>
        Service(db).UpdateStatusAsync(
            orderId,
            status,
            "admin-1",
            "owner@example.com",
            CancellationToken.None);

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

        var result = await Update(db, order.Id, OrderStatus.Ongoing);

        Assert.Equal(StatusUpdateOutcome.Updated, result.Outcome);
        Assert.Equal("Ongoing", result.Order!.Status);

        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.Ongoing, reloaded.Status);
        // Payment state is untouched (spec §5).
        Assert.Equal(paidAtBefore, reloaded.PaidAt);
        Assert.Equal(intentBefore, reloaded.StripePaymentIntentId);
        var audit = Assert.Single(await db.OrderStatusAudits.AsNoTracking().ToListAsync());
        Assert.Equal(OrderStatus.NotStarted, audit.PreviousStatus);
        Assert.Equal(OrderStatus.Ongoing, audit.NewStatus);
        Assert.Equal("admin-1", audit.AdminUserId);
        Assert.Equal("owner@example.com", audit.AdminEmail);
    }

    [Fact]
    public async Task InvalidEnumValue_IsRejected_AndNothingMutated()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: true, status: OrderStatus.NotStarted);

        var result = await Update(db, order.Id, (OrderStatus)99);

        Assert.Equal(StatusUpdateOutcome.InvalidStatus, result.Outcome);
        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.NotStarted, reloaded.Status);
        Assert.Empty(db.OrderStatusAudits);
    }

    [Fact]
    public async Task UnknownId_IsNotFound()
    {
        using var db = NewDb();
        SeedOrder(db, paid: true);

        var result = await Update(db, 99999, OrderStatus.Completed);

        Assert.Equal(StatusUpdateOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task UnpaidOrder_IsRejected_AndStatusUnchanged()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: false, status: OrderStatus.NotStarted);

        var result = await Update(db, order.Id, OrderStatus.Ongoing);

        Assert.Equal(StatusUpdateOutcome.NotPaid, result.Outcome);
        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.NotStarted, reloaded.Status);
        Assert.Null(reloaded.PaidAt);
        Assert.Empty(db.OrderStatusAudits);
    }

    [Fact]
    public async Task PatchNeverStampsPayment_OnAnUnpaidOrder()
    {
        // Defence-in-depth: even the rejected path must leave PaidAt null (payment is webhook-only).
        using var db = NewDb();
        var order = SeedOrder(db, paid: false);

        await Update(db, order.Id, OrderStatus.Completed);

        var reloaded = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
        Assert.Null(reloaded.PaidAt);
        Assert.Null(reloaded.StripePaymentIntentId);
    }

    [Theory]
    [InlineData(OrderStatus.NotStarted, OrderStatus.Completed)]
    [InlineData(OrderStatus.Ongoing, OrderStatus.NotStarted)]
    [InlineData(OrderStatus.Completed, OrderStatus.Ongoing)]
    public async Task InvalidTransitions_AreRejected_WithoutAudit(
        OrderStatus current,
        OrderStatus target)
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: true, status: current);

        var result = await Update(db, order.Id, target);

        Assert.Equal(StatusUpdateOutcome.InvalidTransition, result.Outcome);
        Assert.Equal(
            current,
            (await db.Orders.AsNoTracking().SingleAsync(o => o.Id == order.Id)).Status);
        Assert.Empty(db.OrderStatusAudits);
    }

    [Fact]
    public async Task OngoingToCompleted_Succeeds_AndAuditHistoryIsOldestFirst()
    {
        using var db = NewDb();
        var order = SeedOrder(db, paid: true);
        Assert.Equal(StatusUpdateOutcome.Updated, (await Update(db, order.Id, OrderStatus.Ongoing)).Outcome);
        Assert.Equal(StatusUpdateOutcome.Updated, (await Update(db, order.Id, OrderStatus.Completed)).Outcome);

        var history = await Service(db).GetAuditAsync(order.Id, CancellationToken.None);

        Assert.True(history.OrderExists);
        Assert.Collection(
            history.Records,
            first => Assert.Equal("Ongoing", first.NewStatus),
            second => Assert.Equal("Completed", second.NewStatus));
    }
}
