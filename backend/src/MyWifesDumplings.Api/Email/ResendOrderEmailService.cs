using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Email;

/// <summary>
/// Sends order confirmation emails via the Resend HTTP API (spec §2/§5/§7). The API key is read from
/// <see cref="ResendOptions.ApiKey"/> (user-secrets / Key Vault — never committed). Failures throw; the
/// webhook caller catches and logs so a transient email problem can never lose a confirmed payment.
/// </summary>
public sealed class ResendOrderEmailService : IOrderEmailService
{
    private readonly HttpClient _http;
    private readonly ResendOptions _options;
    private readonly ILogger<ResendOrderEmailService> _logger;

    public ResendOrderEmailService(
        HttpClient http,
        IOptions<ResendOptions> options,
        ILogger<ResendOrderEmailService> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendOrderConfirmationAsync(Order order, CancellationToken ct)
    {
        var subject = $"Order #{order.Id} confirmed — My Wife's Dumplings";

        // Guests get a lookup link so they can view their order without an account (spec §4/§6).
        var lookupLine = order.UserId is null
            ? $"<p>Track your order any time: " +
              $"<a href=\"{_options.LookupBaseUrl}/{order.GuestLookupToken}\">view your order</a>.</p>"
            : "<p>You can view this order in your account under \"My Orders\".</p>";

        var html =
            $"<h1>Thanks for your order!</h1>" +
            $"<p>We've received your payment for order <strong>#{order.Id}</strong>.</p>" +
            lookupLine +
            $"<p>We'll let you know as your order moves through the kitchen.</p>";

        var payload = new
        {
            from = _options.FromAddress,
            to = new[] { order.CustomerEmail },
            subject,
            html,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = JsonContent.Create(payload),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        using var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        _logger.LogInformation(
            "Sent confirmation email for order {OrderId} to {Email}", order.Id, order.CustomerEmail);
    }
}
