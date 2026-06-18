namespace MyWifesDumplings.Api.Payments;

/// <summary>Result of creating a Stripe PaymentIntent.</summary>
/// <param name="PaymentIntentId">Stripe PaymentIntent id — persisted on the Order.</param>
/// <param name="ClientSecret">Returned to the browser so Stripe.js can confirm the card payment.</param>
public sealed record PaymentIntentResult(string PaymentIntentId, string ClientSecret);

/// <summary>
/// Creates Stripe PaymentIntents for a server-computed amount (spec §5). WP-4 only CREATES the
/// intent; confirmation/payment state is set solely by the verified Stripe webhook in WP-5.
/// </summary>
public interface IPaymentIntentService
{
    /// <summary>
    /// Creates a PaymentIntent for <paramref name="amountMinorUnits"/> (e.g. cents) in
    /// <paramref name="currency"/>. The amount is always the server-computed total — never a
    /// client-supplied value. <paramref name="metadata"/> carries the orderId for reconciliation.
    /// </summary>
    Task<PaymentIntentResult> CreateAsync(
        long amountMinorUnits,
        string currency,
        IDictionary<string, string> metadata,
        CancellationToken ct);
}
