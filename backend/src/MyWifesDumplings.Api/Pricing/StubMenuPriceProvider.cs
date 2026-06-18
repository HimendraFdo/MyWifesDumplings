namespace MyWifesDumplings.Api.Pricing;

/// <summary>
/// DEVELOPMENT-ONLY fallback price provider. Registered only when Sanity is not configured AND the
/// environment is Development, so the app composes and unit/integration smoke tests can run without
/// network access. It must NEVER be the production default — the host registers the real
/// <see cref="SanityMenuPriceProvider"/> whenever Sanity config is present (see Program.cs).
///
/// The fixed catalog below is purely illustrative; it is not a menu table (spec §1/§12). Any id not
/// in the dictionary returns null and is rejected by the orders endpoint exactly like a real unknown id.
/// </summary>
public sealed class StubMenuPriceProvider : IMenuPriceProvider
{
    private static readonly IReadOnlyDictionary<string, MenuItemPrice> Catalog =
        new Dictionary<string, MenuItemPrice>(StringComparer.Ordinal)
        {
            ["dev-pork-dumplings"] = new("[DEV] Pork Dumplings", 12.50m),
            ["dev-veggie-dumplings"] = new("[DEV] Veggie Dumplings", 11.00m),
            ["dev-chicken-bao"] = new("[DEV] Chicken Bao", 9.75m),
        };

    public Task<MenuItemPrice?> GetPriceAsync(string menuItemId, CancellationToken ct)
    {
        Catalog.TryGetValue(menuItemId ?? string.Empty, out var price);
        return Task.FromResult(price);
    }
}
