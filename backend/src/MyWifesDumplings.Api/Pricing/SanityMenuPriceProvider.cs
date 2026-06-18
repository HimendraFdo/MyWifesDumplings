using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace MyWifesDumplings.Api.Pricing;

/// <summary>
/// Resolves menu prices from Sanity (the menu source of truth — spec §1/§12) by running a GROQ
/// query over Sanity's HTTP query API. No menu data is duplicated into SQL.
/// </summary>
/// <remarks>
/// GROQ: <c>*[_id == $id][0]{ "name": coalesce(title, name), "price": price }</c>.
/// The document shape (field names <c>title</c>/<c>name</c>, <c>price</c>) follows the existing
/// frontend Sanity schema; adjust the projection if the schema differs. Prices are read as decimal
/// to avoid floating-point rounding before the Stripe minor-units conversion at the boundary.
/// </remarks>
public sealed class SanityMenuPriceProvider : IMenuPriceProvider
{
    private readonly HttpClient _http;
    private readonly SanityOptions _options;

    public SanityMenuPriceProvider(HttpClient http, IOptions<SanityOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<MenuItemPrice?> GetPriceAsync(string menuItemId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(menuItemId) || !_options.IsConfigured)
        {
            return null;
        }

        // GROQ querying a single document by id, projecting just name + price.
        const string groq = "*[_id == $id][0]{\"name\": coalesce(title, name), \"price\": price}";

        var url =
            $"https://{_options.ProjectId}.api.sanity.io/v{_options.ApiVersion}/data/query/{_options.Dataset}" +
            $"?query={Uri.EscapeDataString(groq)}" +
            $"&$id={Uri.EscapeDataString(JsonSerializer.Serialize(menuItemId))}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrWhiteSpace(_options.Token))
        {
            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.Token);
        }

        using var response = await _http.SendAsync(request, ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        if (!doc.RootElement.TryGetProperty("result", out var result)
            || result.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return null;
        }

        if (!result.TryGetProperty("price", out var priceEl)
            || !priceEl.TryGetDecimal(out var price))
        {
            return null;
        }

        var name = result.TryGetProperty("name", out var nameEl) && nameEl.ValueKind == JsonValueKind.String
            ? nameEl.GetString()!
            : menuItemId;

        return new MenuItemPrice(name, price);
    }
}
