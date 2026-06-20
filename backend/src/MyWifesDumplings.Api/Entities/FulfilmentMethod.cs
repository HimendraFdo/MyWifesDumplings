namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// How the customer receives their order. Bound by numeric value over the wire (the frontend sends
/// the integer, mirroring the existing <see cref="OrderStatus"/> convention — no string enum
/// converter is configured). <see cref="Pickup"/> is the default so a legacy/blank order stays a
/// pickup order, matching the business's original pickup-only flow.
/// </summary>
public enum FulfilmentMethod
{
    /// <summary>Customer collects from the kitchen (70 Great South Road, Epsom). No delivery fee.</summary>
    Pickup = 0,

    /// <summary>Delivered to the customer's address. A zone-based <see cref="DeliveryZone"/> fee applies.</summary>
    Delivery = 1,
}
