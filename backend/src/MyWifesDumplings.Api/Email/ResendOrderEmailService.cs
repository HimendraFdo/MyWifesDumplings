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
        // Rendered as a large, full-width tappable button (min ~44px tall) so the link is easy
        // to hit on a phone — most confirmation emails are opened on mobile.
        var lookupUrl = $"{_options.LookupBaseUrl}/{order.GuestLookupToken}";
        var actionBlock = order.UserId is null
            ? $"""
               <p style="margin:0 0 16px;">Track your order any time:</p>
               <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                 <tr><td style="border-radius:8px;background:#C0392B;">
                   <a href="{lookupUrl}"
                      style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#F5E6D3;text-decoration:none;border-radius:8px;">
                     View your order
                   </a>
                 </td></tr>
               </table>
               <p style="margin:0 0 16px;font-size:13px;color:#555;">
                 If the button doesn't work, copy and paste this link:<br>
                 <a href="{lookupUrl}" style="color:#C0392B;word-break:break-all;">{lookupUrl}</a>
               </p>
               """
            : """<p style="margin:0 0 16px;">You can view this order in your account under "My Orders".</p>""";

        // Inline styles + a mobile viewport: email clients strip <style> blocks and external CSS,
        // so all styling is inline and the layout is a single fluid 600px-max column.
        var html =
            $"""
             <!DOCTYPE html>
             <html lang="en">
             <head>
               <meta charset="utf-8">
               <meta name="viewport" content="width=device-width, initial-scale=1.0">
               <title>{subject}</title>
             </head>
             <body style="margin:0;padding:0;background:#F5E6D3;">
               <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5E6D3;">
                 <tr><td align="center" style="padding:24px 16px;">
                   <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                          style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1A0A00;">
                     <tr><td>
                       <h1 style="margin:0 0 16px;font-size:24px;color:#1A0A00;">Thanks for your order!</h1>
                       <p style="margin:0 0 16px;">We've received your payment for order <strong>#{order.Id}</strong>.</p>
                       {actionBlock}
                       <p style="margin:0 0 8px;">We'll message you to arrange a pickup time and place in Auckland, and let you know as your order moves through the kitchen.</p>
                     </td></tr>
                   </table>
                 </td></tr>
               </table>
             </body>
             </html>
             """;

        var payload = new
        {
            from = _options.FromAddress,
            to = new[] { order.CustomerEmail, "mywifesdumplingsofficial@gmail.com" }, // Always CC the business so order confirmations are visible in the shared inbox
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
