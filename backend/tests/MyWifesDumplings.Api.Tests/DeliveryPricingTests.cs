using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Pricing;
using Xunit;

namespace MyWifesDumplings.Api.Tests;

/// <summary>
/// Proves the server-authoritative delivery-fee rules from the business order form: zone base fees,
/// pickup is free, and 60+ dumplings is free anywhere in Auckland (spec §12 — the fee is computed
/// here, never supplied by the client).
/// </summary>
public class DeliveryPricingTests
{
    [Theory]
    [InlineData(DeliveryZone.EastSouth, 2)]
    [InlineData(DeliveryZone.AucklandCentral, 4)]
    [InlineData(DeliveryZone.WestNorth, 8)]
    public void Delivery_Charges_ZoneBaseFee_For_SubThreshold_Order(DeliveryZone zone, decimal expected)
    {
        var fee = DeliveryPricing.Quote(FulfilmentMethod.Delivery, zone, totalDumplings: 20);
        Assert.Equal(expected, fee);
    }

    [Theory]
    [InlineData(DeliveryZone.EastSouth)]
    [InlineData(DeliveryZone.AucklandCentral)]
    [InlineData(DeliveryZone.WestNorth)]
    [InlineData(DeliveryZone.None)]
    public void Pickup_Is_Always_Free(DeliveryZone zone)
    {
        var fee = DeliveryPricing.Quote(FulfilmentMethod.Pickup, zone, totalDumplings: 20);
        Assert.Equal(0m, fee);
    }

    [Theory]
    [InlineData(60)]
    [InlineData(80)]
    public void SixtyPlus_Dumplings_Is_Free_Delivery(int dumplings)
    {
        var fee = DeliveryPricing.Quote(FulfilmentMethod.Delivery, DeliveryZone.WestNorth, totalDumplings: dumplings);
        Assert.Equal(0m, fee);
    }

    [Fact]
    public void Just_Under_Threshold_Still_Charges()
    {
        var fee = DeliveryPricing.Quote(FulfilmentMethod.Delivery, DeliveryZone.AucklandCentral, totalDumplings: 59);
        Assert.Equal(4m, fee);
    }
}
