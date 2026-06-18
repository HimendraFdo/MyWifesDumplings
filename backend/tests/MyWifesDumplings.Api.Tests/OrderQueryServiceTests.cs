using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Orders;
using Xunit;

namespace MyWifesDumplings.Api.Tests;

/// <summary>
/// WP-6 read-side acceptance criteria (spec §8/§12) over EF Core InMemory — no live SQL Server:
///   - the admin list returns ALL orders and the ?status= filter narrows correctly;
///   - GET /api/me/orders returns ONLY the calling user's orders (no IDOR — user A never sees user B's
///     or a guest's orders);
///   - guest lookup returns the matching order for a valid token and nothing for an unknown one;
///   - the secret GuestLookupToken is never present in any read response.
/// </summary>
public class OrderQueryServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"orderquery-tests-{Guid.NewGuid()}")
            .Options);

    private static Order SeedOrder(
        AppDbContext db,
        string? userId,
        string email,
        OrderStatus status,
        bool paid,
        string token,
        params (string name, decimal price, int qty)[] items)
    {
        var order = new Order
        {
            UserId = userId,
            CustomerEmail = email,
            GuestLookupToken = token,
            Status = status,
            PaidAt = paid ? DateTime.UtcNow : null,
            StripePaymentIntentId = paid ? $"pi_{token}" : null,
        };
        foreach (var (name, price, qty) in items)
        {
            order.OrderItems.Add(new OrderItem
            {
                MenuItemId = name.ToLowerInvariant(),
                NameSnapshot = name,
                UnitPriceSnapshot = price,
                Quantity = qty,
            });
        }
        db.Orders.Add(order);
        db.SaveChanges();
        return order;
    }

    [Fact]
    public async Task AdminList_ReturnsAllOrders_WhenNoStatusFilter()
    {
        using var db = NewDb();
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "tA");
        SeedOrder(db, null, "guest@x.com", OrderStatus.Ongoing, paid: true, "tG");
        SeedOrder(db, "userB", "b@x.com", OrderStatus.Completed, paid: true, "tB");

        var result = await new OrderQueryService(db).GetAllAsync(status: null, CancellationToken.None);

        Assert.Equal(3, result.Count);
    }

    [Theory]
    [InlineData(OrderStatus.NotStarted, 1)]
    [InlineData(OrderStatus.Ongoing, 2)]
    [InlineData(OrderStatus.Completed, 1)]
    public async Task AdminList_StatusFilter_NarrowsCorrectly(OrderStatus filter, int expected)
    {
        using var db = NewDb();
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "t1");
        SeedOrder(db, "userB", "b@x.com", OrderStatus.Ongoing, paid: true, "t2");
        SeedOrder(db, null, "g@x.com", OrderStatus.Ongoing, paid: true, "t3");
        SeedOrder(db, "userC", "c@x.com", OrderStatus.Completed, paid: true, "t4");

        var result = await new OrderQueryService(db).GetAllAsync(filter, CancellationToken.None);

        Assert.Equal(expected, result.Count);
        Assert.All(result, r => Assert.Equal(filter.ToString(), r.Status));
    }

    [Fact]
    public async Task AdminList_ComputesTotalServerSide()
    {
        using var db = NewDb();
        // 12.50 x 2 + 9.75 x 3 = 25.00 + 29.25 = 54.25
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "tA",
            ("Pork", 12.50m, 2), ("Bao", 9.75m, 3));

        var result = await new OrderQueryService(db).GetAllAsync(null, CancellationToken.None);

        var order = Assert.Single(result);
        Assert.Equal(54.25m, order.Total);
        Assert.Equal(25.00m, order.Items.Single(i => i.NameSnapshot == "Pork").LineTotal);
    }

    [Fact]
    public async Task MyOrders_ReturnsOnly_CallersOwnOrders_NoIdor()
    {
        using var db = NewDb();
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "tA1");
        SeedOrder(db, "userA", "a@x.com", OrderStatus.Ongoing, paid: true, "tA2");
        SeedOrder(db, "userB", "b@x.com", OrderStatus.NotStarted, paid: true, "tB1");
        SeedOrder(db, null, "guest@x.com", OrderStatus.NotStarted, paid: true, "tG1");

        var svc = new OrderQueryService(db);
        var forA = await svc.GetForUserAsync("userA", CancellationToken.None);

        Assert.Equal(2, forA.Count);
        // A never sees B's order or the guest order.
        Assert.All(forA, o => Assert.Contains(o.Id, new[] { 1, 2 }));
        Assert.DoesNotContain(forA, o => o.CustomerEmail == "b@x.com");
        Assert.DoesNotContain(forA, o => o.CustomerEmail == "guest@x.com");
    }

    [Fact]
    public async Task MyOrders_NullOrBlankCaller_ReturnsEmpty()
    {
        using var db = NewDb();
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "tA1");
        SeedOrder(db, null, "guest@x.com", OrderStatus.NotStarted, paid: true, "tG1");

        var svc = new OrderQueryService(db);

        Assert.Empty(await svc.GetForUserAsync(null, CancellationToken.None));
        Assert.Empty(await svc.GetForUserAsync("   ", CancellationToken.None));
    }

    [Fact]
    public async Task Lookup_ValidToken_ReturnsThatOrder()
    {
        using var db = NewDb();
        SeedOrder(db, null, "guest@x.com", OrderStatus.NotStarted, paid: true, "secret-token-abc",
            ("Pork", 10m, 1));
        SeedOrder(db, "userB", "b@x.com", OrderStatus.Ongoing, paid: true, "other-token");

        var result = await new OrderQueryService(db)
            .GetByLookupTokenAsync("secret-token-abc", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("guest@x.com", result!.CustomerEmail);
    }

    [Fact]
    public async Task Lookup_UnknownToken_ReturnsNull()
    {
        using var db = NewDb();
        SeedOrder(db, null, "guest@x.com", OrderStatus.NotStarted, paid: true, "real-token");

        var result = await new OrderQueryService(db)
            .GetByLookupTokenAsync("nope", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Lookup_NullOrBlankToken_ReturnsNull_NoEnumeration()
    {
        using var db = NewDb();
        SeedOrder(db, null, "guest@x.com", OrderStatus.NotStarted, paid: true, "real-token");

        var svc = new OrderQueryService(db);
        Assert.Null(await svc.GetByLookupTokenAsync(null, CancellationToken.None));
        Assert.Null(await svc.GetByLookupTokenAsync("", CancellationToken.None));
        Assert.Null(await svc.GetByLookupTokenAsync("   ", CancellationToken.None));
    }

    [Theory]
    [InlineData("NotStarted", OrderStatus.NotStarted)]
    [InlineData("ongoing", OrderStatus.Ongoing)]   // case-insensitive
    [InlineData("COMPLETED", OrderStatus.Completed)]
    [InlineData("0", OrderStatus.NotStarted)]       // numeric values accepted...
    [InlineData("1", OrderStatus.Ongoing)]
    [InlineData("2", OrderStatus.Completed)]
    public void StatusFilter_AcceptsNames_AndDefinedNumbers(string input, OrderStatus expected)
    {
        Assert.True(OrderStatusFilter.TryParse(input, out var filter));
        Assert.Equal(expected, filter);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void StatusFilter_NullOrBlank_MeansNoFilter(string? input)
    {
        Assert.True(OrderStatusFilter.TryParse(input, out var filter));
        Assert.Null(filter); // no filter => all orders
    }

    [Theory]
    [InlineData("99")]      // ...but out-of-range numbers are rejected
    [InlineData("-1")]
    [InlineData("Cooking")] // unknown name
    public void StatusFilter_UnknownNameOrOutOfRangeNumber_IsRejected(string input)
    {
        Assert.False(OrderStatusFilter.TryParse(input, out var filter));
        Assert.Null(filter);
    }

    [Fact]
    public async Task ReadResponses_NeverLeak_GuestLookupToken()
    {
        // The response record has no token field by construction; assert it serializes without one.
        using var db = NewDb();
        SeedOrder(db, "userA", "a@x.com", OrderStatus.NotStarted, paid: true, "super-secret-token",
            ("Pork", 10m, 1));

        var list = await new OrderQueryService(db).GetAllAsync(null, CancellationToken.None);
        var json = System.Text.Json.JsonSerializer.Serialize(list);

        Assert.DoesNotContain("super-secret-token", json);
        Assert.DoesNotContain("GuestLookupToken", json, StringComparison.OrdinalIgnoreCase);
    }
}
