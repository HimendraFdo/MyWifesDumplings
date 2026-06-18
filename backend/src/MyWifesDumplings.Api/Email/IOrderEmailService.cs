using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Email;

/// <summary>
/// Sends the order confirmation email after a payment is confirmed by the Stripe webhook (spec §5/§7).
/// This is a seam: production uses <see cref="ResendOrderEmailService"/> (Resend HTTP API); a
/// Development-only no-op (<see cref="NoOpOrderEmailService"/>) logs instead of sending so the app
/// composes without Resend credentials. Email is best-effort and must NEVER block or roll back a
/// confirmed payment — the webhook marks the order paid and persists FIRST, then attempts the email.
/// </summary>
public interface IOrderEmailService
{
    /// <summary>
    /// Sends the confirmation email for <paramref name="order"/> to its <see cref="Order.CustomerEmail"/>.
    /// Includes the order id and, for guests, the <see cref="Order.GuestLookupToken"/> lookup link.
    /// </summary>
    Task SendOrderConfirmationAsync(Order order, CancellationToken ct);
}
