using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Email;
using MyWifesDumplings.Api.Entities;
using Stripe;

namespace MyWifesDumplings.Api.Payments;

/// <summary>Outcome of processing a Stripe webhook delivery.</summary>
public enum WebhookOutcome
{
    /// <summary>Signature could not be verified (or no secret configured) — caller returns 400.</summary>
    InvalidSignature,

    /// <summary>Event accepted (handled, ignored, or no-op) — caller returns 200 so Stripe stops retrying.</summary>
    Acknowledged,
}

/// <summary>Result of <see cref="StripeWebhookService.ProcessAsync"/>.</summary>
/// <param name="Outcome">How the caller should respond (200 vs 400).</param>
/// <param name="Message">Human-readable detail (for the 400 body / logs).</param>
public sealed record WebhookResult(WebhookOutcome Outcome, string Message)
{
    public static WebhookResult Invalid(string message) => new(WebhookOutcome.InvalidSignature, message);
    public static WebhookResult Ack(string message) => new(WebhookOutcome.Acknowledged, message);
}

/// <summary>
/// Verifies and processes Stripe webhook deliveries (spec §5/§7/§8/§12). This is the SINGLE source of
/// truth for payment state — no other code path sets <see cref="Order.PaidAt"/>. It is deliberately
/// testable: it takes the raw request body + signature header (not an <c>HttpRequest</c>), verifies
/// the Stripe signature against <see cref="StripeOptions.WebhookSecret"/>, and updates the order via
/// <see cref="AppDbContext"/>.
///
/// Guarantees:
/// <list type="bullet">
///   <item>Invalid/unsigned/unconfigured → <see cref="WebhookOutcome.InvalidSignature"/> (HTTP 400); no mutation.</item>
///   <item>Idempotent: a redelivered <c>payment_intent.succeeded</c> for an already-paid order is a no-op.</item>
///   <item>Unhandled event types and unknown PaymentIntents are acknowledged (200), never 500.</item>
///   <item>Email is best-effort and sent AFTER the paid state is persisted — it can never lose a payment.</item>
/// </list>
/// </summary>
public sealed class StripeWebhookService
{
    private readonly AppDbContext _db;
    private readonly IOrderEmailService _email;
    private readonly StripeOptions _stripeOptions;
    private readonly ILogger<StripeWebhookService> _logger;

    public StripeWebhookService(
        AppDbContext db,
        IOrderEmailService email,
        StripeOptions stripeOptions,
        ILogger<StripeWebhookService> logger)
    {
        _db = db;
        _email = email;
        _stripeOptions = stripeOptions;
        _logger = logger;
    }

    public async Task<WebhookResult> ProcessAsync(string json, string? signatureHeader, CancellationToken ct)
    {
        if (!_stripeOptions.IsWebhookConfigured)
        {
            // Never trust an unverifiable delivery: with no signing secret we cannot validate it.
            _logger.LogError("Stripe webhook secret is not configured; rejecting delivery.");
            return WebhookResult.Invalid("Webhook signing secret is not configured.");
        }

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            _logger.LogWarning("Stripe webhook received with no Stripe-Signature header; rejecting.");
            return WebhookResult.Invalid("Missing Stripe-Signature header.");
        }

        Event stripeEvent;
        try
        {
            // Verifies t=<ts>,v1=<HMACSHA256(ts.payload, secret)> over the EXACT raw bytes.
            // throwOnApiVersionMismatch: false — a Stripe API version bump must not cause us to drop a
            // genuinely-signed event; we only depend on the small, stable subset of fields read below.
            stripeEvent = EventUtility.ConstructEvent(
                json,
                signatureHeader,
                _stripeOptions.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Stripe webhook signature verification failed; rejecting.");
            return WebhookResult.Invalid("Invalid Stripe signature.");
        }

        // Only payment success drives state. Acknowledge everything else so Stripe stops retrying (§8).
        if (stripeEvent.Type != EventTypes.PaymentIntentSucceeded)
        {
            _logger.LogInformation("Ignoring unhandled Stripe event type {EventType}.", stripeEvent.Type);
            return WebhookResult.Ack($"Ignored event type '{stripeEvent.Type}'.");
        }

        if (stripeEvent.Data.Object is not PaymentIntent intent || string.IsNullOrWhiteSpace(intent.Id))
        {
            _logger.LogWarning("payment_intent.succeeded had no PaymentIntent payload; acknowledging.");
            return WebhookResult.Ack("No PaymentIntent on event.");
        }

        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == intent.Id, ct);

        if (order is null)
        {
            // Acknowledge (don't 500) but log a warning — could be a different account/env or stale event.
            _logger.LogWarning(
                "No order found for PaymentIntent {PaymentIntentId}; acknowledging.", intent.Id);
            return WebhookResult.Ack("No matching order.");
        }

        // Idempotency (§8/§12): Stripe can redeliver. If already paid, no-op — never double-process.
        if (order.PaidAt is not null)
        {
            _logger.LogInformation(
                "Order {OrderId} already marked paid; ignoring duplicate event.", order.Id);
            return WebhookResult.Ack("Order already paid.");
        }

        // Source of truth: mark paid + status NotStarted, then PERSIST FIRST (spec §5/§7/§12).
        order.PaidAt = DateTime.UtcNow;
        order.Status = OrderStatus.NotStarted;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Order {OrderId} marked paid via PaymentIntent {PaymentIntentId}.", order.Id, intent.Id);

        // Best-effort email AFTER persistence: a send failure must NOT lose the confirmed payment (§5/§7).
        try
        {
            await _email.SendOrderConfirmationAsync(order, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Confirmation email failed for paid order {OrderId}; payment is still recorded.", order.Id);
        }

        return WebhookResult.Ack("Order marked paid.");
    }
}
