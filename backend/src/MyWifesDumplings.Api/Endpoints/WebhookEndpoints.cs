using MyWifesDumplings.Api.Payments;

namespace MyWifesDumplings.Api.Endpoints;

/// <summary>
/// Stripe webhook endpoint (WP-5, spec §8): <c>POST /api/webhooks/stripe</c>. Public and
/// server-to-server — NO JWT/auth and no CORS concern (Stripe is not a browser origin). The body is
/// read as the EXACT raw bytes (no model binding) because Stripe signature verification hashes the
/// raw payload. All processing lives in the testable <see cref="StripeWebhookService"/>.
/// </summary>
public static class WebhookEndpoints
{
    public static IEndpointRouteBuilder MapWebhookEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/webhooks/stripe", async (
            HttpRequest request,
            StripeWebhookService webhooks,
            CancellationToken ct) =>
        {
            // Read the raw body verbatim. Binding to a DTO would consume/normalise the bytes and break
            // signature verification, so we take HttpRequest and read the stream ourselves.
            using var reader = new StreamReader(request.Body);
            var json = await reader.ReadToEndAsync(ct);

            var signature = request.Headers["Stripe-Signature"].ToString();

            var result = await webhooks.ProcessAsync(json, signature, ct);

            // Verified failures -> 400 (Stripe will not retry an unsigned/invalid call). Everything we
            // accept (handled, ignored, or no-op) -> 200 so Stripe stops retrying (§8).
            return result.Outcome == WebhookOutcome.InvalidSignature
                ? Results.BadRequest(new { error = result.Message })
                : Results.Ok(new { received = true });
        })
        .WithName("StripeWebhook")
        .WithTags("Webhooks")
        .AllowAnonymous()
        .WithOpenApi();

        return app;
    }
}
