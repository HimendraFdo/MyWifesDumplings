using System.ComponentModel.DataAnnotations;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Orders;

/// <summary>
/// A single cart line from the client. Carries ONLY a menu item id + quantity.
///
/// SECURITY (spec §12): there is deliberately NO price/amount/total field here. The server resolves
/// the price from <c>IMenuPriceProvider</c> (Sanity). Client price tampering is structurally
/// impossible because the wire format has nowhere to put a price.
/// </summary>
public sealed record CartLineRequest(
    [property: Required] string MenuItemId,
    [property: Range(1, 1000)] int Quantity);

/// <summary>
/// Create-order request. Contains the customer's contact details, the cart lines, the chosen flavour,
/// and the fulfilment choice (pickup vs delivery + address) — but NO price/amount/total/fee anywhere
/// in the payload (spec §8/§12). The total AND the delivery fee are always computed server-side.
/// <see cref="Flavour"/> and the contact/fulfilment fields are order metadata (they do not affect line
/// prices); the delivery fee is derived from <see cref="Method"/>/<see cref="Zone"/> on the server.
///
/// The new fields are optional on the wire (defaulted) so older callers compile, but
/// <see cref="Validate"/> enforces the real requirements at the endpoint: name + phone are always
/// required, and a delivery order additionally requires a zone, address, and post code.
/// </summary>
public sealed record CreateOrderRequest(
    [property: Required, EmailAddress] string CustomerEmail,
    [property: Required, MinLength(1)] IReadOnlyList<CartLineRequest> Items,
    [property: MaxLength(100)] string? Flavour = null,
    [property: MaxLength(120)] string? CustomerName = null,
    [property: MaxLength(40)] string? CustomerPhone = null,
    FulfilmentMethod Method = FulfilmentMethod.Pickup,
    DeliveryZone? Zone = null,
    [property: MaxLength(250)] string? DeliveryAddress = null,
    [property: MaxLength(20)] string? DeliveryPostcode = null,
    [property: MaxLength(500)] string? DeliveryNotes = null,
    [property: MaxLength(60)] string? PreferredDay = null,
    [property: MaxLength(60)] string? PreferredTime = null) : IValidatableObject
{
    /// <summary>
    /// Conditional rules that data annotations can't express: contact details are always required, and
    /// delivery orders need a zone + address + post code. Pickup orders need none of the delivery fields.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(CustomerName))
        {
            yield return new ValidationResult("Your name is required.", new[] { nameof(CustomerName) });
        }

        if (string.IsNullOrWhiteSpace(CustomerPhone))
        {
            yield return new ValidationResult("A contact phone number is required.", new[] { nameof(CustomerPhone) });
        }

        if (Method == FulfilmentMethod.Delivery)
        {
            if (Zone is null or DeliveryZone.None)
            {
                yield return new ValidationResult("Please choose a delivery area.", new[] { nameof(Zone) });
            }

            if (string.IsNullOrWhiteSpace(DeliveryAddress))
            {
                yield return new ValidationResult("A delivery address is required.", new[] { nameof(DeliveryAddress) });
            }

            if (string.IsNullOrWhiteSpace(DeliveryPostcode))
            {
                yield return new ValidationResult("A post code is required.", new[] { nameof(DeliveryPostcode) });
            }
        }
    }
}

/// <summary>
/// Response: the new order id, the Stripe client secret for the browser to confirm payment, and the
/// server-computed amounts (<see cref="DeliveryFee"/> + <see cref="Total"/>) so the payment step shows
/// the AUTHORITATIVE figures rather than relying on the client-side estimate.
/// </summary>
public sealed record CreateOrderResponse(int OrderId, string ClientSecret, decimal DeliveryFee, decimal Total);
