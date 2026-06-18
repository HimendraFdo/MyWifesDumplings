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
/// Create-order request. Contains ONLY the customer email and the cart lines — NO price/amount/total
/// anywhere in the payload (spec §8/§12). The total is always computed server-side.
/// </summary>
public sealed record CreateOrderRequest(
    [property: Required, EmailAddress] string CustomerEmail,
    [property: Required, MinLength(1)] IReadOnlyList<CartLineRequest> Items);

/// <summary>Response: the new order id + the Stripe client secret for the browser to confirm payment.</summary>
public sealed record CreateOrderResponse(int OrderId, string ClientSecret);
