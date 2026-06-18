using Moq;
using MyWifesDumplings.Api.Orders;
using MyWifesDumplings.Api.Pricing;
using Xunit;

namespace MyWifesDumplings.Api.Tests;

/// <summary>
/// Proves the spec §12 security rule WITHOUT a DB, Stripe, or the network. <see cref="IMenuPriceProvider"/>
/// is mocked so the tests assert that:
///   (a) the computed amount == Σ(serverUnitPrice × qty),
///   (b) an unknown MenuItemId is rejected,
///   (c) OrderItem snapshots equal the SERVER price/name — never anything client-supplied.
///
/// Client price tampering is STRUCTURALLY IMPOSSIBLE: <see cref="CreateOrderRequest"/> /
/// <see cref="CartLineRequest"/> have no price/amount/total field, so there is nowhere on the wire to
/// inject a price. The server resolves every price from the mocked provider below.
/// </summary>
public class OrderCreationServiceTests
{
    private static OrderCreationService BuildSut(IMenuPriceProvider provider) => new(provider);

    private static Mock<IMenuPriceProvider> MockProvider(params (string id, string name, decimal price)[] items)
    {
        var mock = new Mock<IMenuPriceProvider>(MockBehavior.Strict);
        foreach (var (id, name, price) in items)
        {
            mock.Setup(p => p.GetPriceAsync(id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MenuItemPrice(name, price));
        }
        return mock;
    }

    [Fact]
    public async Task ComputedAmount_Equals_Sum_Of_ServerUnitPrice_Times_Quantity()
    {
        // Server prices: $12.50 x 2 + $9.75 x 3 = $25.00 + $29.25 = $54.25 => 5425 cents.
        var provider = MockProvider(
            ("pork", "Pork Dumplings", 12.50m),
            ("bao", "Chicken Bao", 9.75m));

        var request = new CreateOrderRequest("guest@example.com", new[]
        {
            new CartLineRequest("pork", 2),
            new CartLineRequest("bao", 3),
        });

        var result = await BuildSut(provider.Object).BuildAsync(request, authenticatedUserId: null, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(5425L, result.AmountMinorUnits);
        // Sanity-check the decimal sum independent of the cents conversion.
        var expected = 12.50m * 2 + 9.75m * 3;
        Assert.Equal(OrderCreationService.ToMinorUnits(expected), result.AmountMinorUnits);
    }

    [Fact]
    public async Task UnknownMenuItemId_Is_Rejected()
    {
        var provider = new Mock<IMenuPriceProvider>(MockBehavior.Strict);
        provider.Setup(p => p.GetPriceAsync("ghost", It.IsAny<CancellationToken>()))
                .ReturnsAsync((MenuItemPrice?)null); // unknown id => null => reject

        var request = new CreateOrderRequest("guest@example.com", new[] { new CartLineRequest("ghost", 1) });

        var result = await BuildSut(provider.Object).BuildAsync(request, null, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Null(result.Order);
        Assert.Contains("ghost", result.Error);
    }

    [Fact]
    public async Task OrderItem_Snapshots_Come_From_Server_Price_Not_Client()
    {
        // The provider (server) is the ONLY source of name + price. There is no client price to compare
        // against because the request DTO has no price field — this is the structural guarantee.
        var provider = MockProvider(("pork", "Server Pork Name", 12.50m));

        var request = new CreateOrderRequest("guest@example.com", new[] { new CartLineRequest("pork", 4) });

        var result = await BuildSut(provider.Object).BuildAsync(request, null, CancellationToken.None);

        Assert.True(result.Succeeded);
        var item = Assert.Single(result.Order!.OrderItems);
        Assert.Equal("pork", item.MenuItemId);
        Assert.Equal("Server Pork Name", item.NameSnapshot);   // from server, not client
        Assert.Equal(12.50m, item.UnitPriceSnapshot);          // from server, not client
        Assert.Equal(4, item.Quantity);
        // 12.50 x 4 = 50.00 => 5000 cents.
        Assert.Equal(5000L, result.AmountMinorUnits);
    }

    [Fact]
    public async Task NonPositive_Quantity_Is_Rejected()
    {
        // Strict mock with no setup: if the service tried to price a zero-qty line it would throw —
        // proving the quantity guard runs before any price lookup.
        var provider = new Mock<IMenuPriceProvider>(MockBehavior.Strict);

        var request = new CreateOrderRequest("guest@example.com", new[] { new CartLineRequest("pork", 0) });

        var result = await BuildSut(provider.Object).BuildAsync(request, null, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("positive", result.Error);
    }

    [Fact]
    public async Task GuestPath_Generates_LookupToken_And_Null_UserId()
    {
        var provider = MockProvider(("pork", "Pork", 10m));
        var request = new CreateOrderRequest("guest@example.com", new[] { new CartLineRequest("pork", 1) });

        var result = await BuildSut(provider.Object).BuildAsync(request, authenticatedUserId: null, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Null(result.Order!.UserId);
        Assert.False(string.IsNullOrWhiteSpace(result.Order.GuestLookupToken));
    }

    [Fact]
    public async Task AccountPath_Stamps_UserId_From_Token_Subject()
    {
        var provider = MockProvider(("pork", "Pork", 10m));
        var request = new CreateOrderRequest("member@example.com", new[] { new CartLineRequest("pork", 1) });

        var result = await BuildSut(provider.Object).BuildAsync(request, authenticatedUserId: "user-123", CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("user-123", result.Order!.UserId);
    }

    [Fact]
    public void GuestLookupTokens_Are_Random()
    {
        var a = OrderCreationService.GenerateGuestLookupToken();
        var b = OrderCreationService.GenerateGuestLookupToken();
        Assert.NotEqual(a, b);
        Assert.True(a.Length >= 32);
    }
}
