using System.ComponentModel.DataAnnotations;

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
/// Create-order request. Contains the customer email, the cart lines, and the chosen dumpling
/// flavour — but NO price/amount/total anywhere in the payload (spec §8/§12). The total is always
/// computed server-side. <see cref="Flavour"/> is order metadata (it does not affect price), so it
/// is captured from the request; it is optional on the wire for backwards compatibility.
/// </summary>
public sealed record CreateOrderRequest(
    [property: Required, EmailAddress] string CustomerEmail,
    [property: Required, MinLength(1)] IReadOnlyList<CartLineRequest> Items,
    [property: MaxLength(100)] string? Flavour = null);

/// <summary>Response: the new order id + the Stripe client secret for the browser to confirm payment.</summary>
public sealed record CreateOrderResponse(int OrderId, string ClientSecret);
