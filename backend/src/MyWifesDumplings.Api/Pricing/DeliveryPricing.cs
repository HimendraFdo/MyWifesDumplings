using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Pricing;

/// <summary>
/// Server-authoritative delivery-fee rules, taken from the business's order form. Pure and static so
/// it is trivially unit-testable and so the fee can NEVER be supplied by the client (spec §12): the
/// request only carries the chosen method/zone (enums) — the fee itself is computed here.
///
/// Zone base fees: East &amp; South $2, Auckland Central $4, West &amp; North $8. Free-delivery rule
/// (also from the form): pickup is always free, and any order of
/// <see cref="FreeDeliveryPieceThreshold"/>+ dumplings is free across Auckland.
/// </summary>
public static class DeliveryPricing
{
    /// <summary>Orders of this many dumplings (or more) get free delivery anywhere in Auckland.</summary>
    public const int FreeDeliveryPieceThreshold = 60;

    /// <summary>Base delivery fee for a zone (before free rules), in dollars.</summary>
    public static decimal BaseFee(DeliveryZone zone) => zone switch
    {
        DeliveryZone.EastSouth => 2m,
        DeliveryZone.AucklandCentral => 4m,
        DeliveryZone.WestNorth => 8m,
        _ => 0m,
    };

    /// <summary>
    /// Computes the fee actually charged. Pickup → 0. Otherwise the zone base fee, waived (0) when the
    /// order is <see cref="FreeDeliveryPieceThreshold"/>+ dumplings.
    /// </summary>
    /// <param name="method">Pickup or delivery.</param>
    /// <param name="zone">Delivery area (ignored for pickup).</param>
    /// <param name="totalDumplings">Total dumpling count across the order (drives the 60+ free rule).</param>
    public static decimal Quote(FulfilmentMethod method, DeliveryZone zone, int totalDumplings)
    {
        if (method != FulfilmentMethod.Delivery)
        {
            return 0m;
        }

        if (totalDumplings >= FreeDeliveryPieceThreshold)
        {
            return 0m;
        }

        return BaseFee(zone);
    }
}
