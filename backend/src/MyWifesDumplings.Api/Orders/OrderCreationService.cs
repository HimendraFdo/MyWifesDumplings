using System.Security.Cryptography;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Payments;
using MyWifesDumplings.Api.Pricing;

namespace MyWifesDumplings.Api.Orders;

/// <summary>Outcome of attempting to build a priced order from a cart.</summary>
public sealed record OrderBuildResult(Order? Order, long AmountMinorUnits, string? Error)
{
    public bool Succeeded => Order is not null && Error is null;

    public static OrderBuildResult Fail(string error) => new(null, 0, error);
    public static OrderBuildResult Ok(Order order, long amountMinorUnits) => new(order, amountMinorUnits, null);
}

/// <summary>
/// Pure (no DB, no Stripe, no network) order-building logic. Given a cart, it resolves every line's
/// price from <see cref="IMenuPriceProvider"/>, rejects unknown ids / bad quantities, computes the
/// total in <see cref="decimal"/>, converts to Stripe minor units at the boundary, and produces an
/// <see cref="Order"/> whose <c>OrderItem</c>s carry server-side name/price SNAPSHOTS (spec §6/§12).
///
/// SECURITY: this class never reads a price from the request — the request DTO has no price field.
/// Tests mock <see cref="IMenuPriceProvider"/> to prove the total and snapshots come from the server.
/// </summary>
public sealed class OrderCreationService
{
    private readonly IMenuPriceProvider _priceProvider;

    public OrderCreationService(IMenuPriceProvider priceProvider)
    {
        _priceProvider = priceProvider;
    }

    /// <summary>
    /// Builds an unpaid <see cref="Order"/> (PaidAt = null) with server-priced line snapshots and the
    /// Stripe amount in minor units. Guest vs. account is unified: pass the authenticated user id
    /// (from the JWT subject) or null for a guest — a guest gets a fresh cryptographic
    /// <see cref="Order.GuestLookupToken"/>. The code path is identical either way (spec §4/§6).
    /// </summary>
    public async Task<OrderBuildResult> BuildAsync(
        CreateOrderRequest request,
        string? authenticatedUserId,
        CancellationToken ct)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            return OrderBuildResult.Fail("Order must contain at least one item.");
        }

        static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        var order = new Order
        {
            CustomerEmail = request.CustomerEmail,
            // Chosen dumpling type — order metadata, not priced. Trimmed; null when blank.
            Flavour = Clean(request.Flavour),
            // Contact + fulfilment metadata (does not affect line pricing). Trimmed; null when blank.
            CustomerName = Clean(request.CustomerName),
            CustomerPhone = Clean(request.CustomerPhone),
            Method = request.Method,
            // Pickup carries no zone; normalise an explicit None to null too.
            Zone = request.Method == FulfilmentMethod.Delivery && request.Zone is not (null or DeliveryZone.None)
                ? request.Zone
                : null,
            DeliveryAddress = request.Method == FulfilmentMethod.Delivery ? Clean(request.DeliveryAddress) : null,
            DeliveryPostcode = request.Method == FulfilmentMethod.Delivery ? Clean(request.DeliveryPostcode) : null,
            DeliveryNotes = Clean(request.DeliveryNotes),
            PreferredDay = Clean(request.PreferredDay),
            PreferredTime = Clean(request.PreferredTime),
            // PaidAt stays null — WP-4 creates an UNPAID order. The webhook (WP-5) stamps payment.
            PaidAt = null,
        };

        // Guest vs. account: identical path, only the identity stamping differs (spec §4/§6).
        if (!string.IsNullOrWhiteSpace(authenticatedUserId))
        {
            order.UserId = authenticatedUserId;
            order.GuestLookupToken = GenerateGuestLookupToken(); // still set; harmless and uniform.
        }
        else
        {
            order.UserId = null;
            order.GuestLookupToken = GenerateGuestLookupToken();
        }

        decimal total = 0m;
        var totalDumplings = 0;

        foreach (var line in request.Items)
        {
            if (string.IsNullOrWhiteSpace(line.MenuItemId))
            {
                return OrderBuildResult.Fail("Each item must have a menu item id.");
            }

            if (line.Quantity <= 0)
            {
                return OrderBuildResult.Fail($"Quantity for '{line.MenuItemId}' must be positive.");
            }

            // Authoritative price/name from the server source — NEVER from the client.
            var price = await _priceProvider.GetPriceAsync(line.MenuItemId, ct);
            if (price is null)
            {
                return OrderBuildResult.Fail($"Unknown or invalid menu item: '{line.MenuItemId}'.");
            }

            if (price.UnitPrice < 0m)
            {
                return OrderBuildResult.Fail($"Invalid price for menu item: '{line.MenuItemId}'.");
            }

            total += price.UnitPrice * line.Quantity;
            // Count dumplings for the 60+ free-delivery rule (tiers carry a piece count; others null).
            totalDumplings += (price.Dumplings ?? 0) * line.Quantity;

            order.OrderItems.Add(new OrderItem
            {
                MenuItemId = line.MenuItemId,
                NameSnapshot = price.Name,          // server snapshot, not client-supplied
                UnitPriceSnapshot = price.UnitPrice, // server snapshot, not client-supplied
                Quantity = line.Quantity,
            });
        }

        if (total <= 0m)
        {
            return OrderBuildResult.Fail("Order total must be greater than zero.");
        }

        // Delivery fee is ALWAYS server-computed from the chosen method/zone + free rules (spec §12).
        var deliveryFee = DeliveryPricing.Quote(
            order.Method,
            order.Zone ?? DeliveryZone.None,
            totalDumplings);
        order.DeliveryFee = deliveryFee;

        var amountMinorUnits = ToMinorUnits(total + deliveryFee);
        return OrderBuildResult.Ok(order, amountMinorUnits);
    }

    /// <summary>
    /// Converts a decimal major-unit amount (e.g. dollars) to Stripe minor units (e.g. cents) at the
    /// boundary, rounding to the nearest cent (banker's rounding avoided in favour of away-from-zero
    /// so customers are charged the displayed total).
    /// </summary>
    public static long ToMinorUnits(decimal majorUnits) =>
        (long)decimal.Round(majorUnits * 100m, 0, MidpointRounding.AwayFromZero);

    /// <summary>Cryptographically-random, URL-safe guest lookup token (spec §6).</summary>
    public static string GenerateGuestLookupToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
