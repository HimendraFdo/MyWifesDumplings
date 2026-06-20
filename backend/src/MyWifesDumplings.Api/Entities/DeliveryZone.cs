namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// Auckland delivery area for a <see cref="FulfilmentMethod.Delivery"/> order. The zone determines the
/// base delivery fee (see <c>DeliveryPricing</c>) — these are the areas/charges from the business's
/// order form. <see cref="None"/> is used for pickup orders (no zone). Bound by numeric value over the
/// wire, like <see cref="FulfilmentMethod"/>.
/// </summary>
public enum DeliveryZone
{
    /// <summary>No delivery zone — used for pickup orders.</summary>
    None = 0,

    /// <summary>East &amp; South Auckland — $2 delivery.</summary>
    EastSouth = 1,

    /// <summary>Auckland Central — $4 delivery.</summary>
    AucklandCentral = 2,

    /// <summary>West &amp; North Auckland — $8 delivery.</summary>
    WestNorth = 3,
}
