namespace MyWifesDumplings.Api.Pricing;

/// <summary>
/// Server-side price for a single menu item. The name + price are the authoritative values
/// used to compute order totals and to snapshot onto <c>OrderItem</c> (spec §6, §12). They are
/// resolved from the menu source of truth (Sanity), never from the client request.
/// </summary>
/// <param name="Name">Display name at lookup time — snapshotted onto the OrderItem.</param>
/// <param name="UnitPrice">Authoritative unit price (major currency units, e.g. dollars).</param>
/// <param name="Dumplings">
/// How many dumplings this item represents (a pricing tier's piece count; null/0 for non-dumpling
/// items like sauces/soups). Used server-side to apply the 60+ free-delivery rule — never affects price.
/// </param>
public sealed record MenuItemPrice(string Name, decimal UnitPrice, int? Dumplings = null);

/// <summary>
/// Resolves the authoritative price/name for a menu item id. Sanity remains the menu source of
/// truth (spec §1, §12) — there is deliberately no menu/product table in SQL. The orders endpoint
/// uses this to compute totals server-side; a client-supplied price is never read.
/// </summary>
public interface IMenuPriceProvider
{
    /// <summary>
    /// Returns the price/name for <paramref name="menuItemId"/>, or <c>null</c> if the id is
    /// unknown/invalid. A null result causes the order to be rejected (400).
    /// </summary>
    Task<MenuItemPrice?> GetPriceAsync(string menuItemId, CancellationToken ct);
}
