using Microsoft.Extensions.Options;
using Stripe;

namespace MyWifesDumplings.Api.Payments;

/// <summary>
/// Creates Stripe PaymentIntents via Stripe.net for the server-computed amount (spec §5). The card
/// is collected browser -> Stripe directly; this service only creates the intent and returns the
/// client secret. Payment confirmation is NOT done here — that is the verified webhook in WP-5.
/// </summary>
public sealed class StripePaymentIntentService : IPaymentIntentService
{
    private readonly StripeOptions _options;

    public StripePaymentIntentService(IOptions<StripeOptions> options)
    {
        _options = options.Value;
    }

    public async Task<PaymentIntentResult> CreateAsync(
        long amountMinorUnits,
        string currency,
        IDictionary<string, string> metadata,
        CancellationToken ct)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = amountMinorUnits,
            Currency = currency,
            Metadata = new Dictionary<string, string>(metadata),
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true
            }
        };

        // Per-request key keeps the service stateless and Key-Vault/user-secrets friendly.
        var requestOptions = new RequestOptions { ApiKey = _options.SecretKey };

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(options, requestOptions, ct);

        return new PaymentIntentResult(intent.Id, intent.ClientSecret);
    }
}
