namespace MyWifesDumplings.Api.Payments;

/// <summary>
/// Stripe configuration, bound from the "Stripe" section. <see cref="SecretKey"/> is a secret and is
/// left EMPTY in the repo (spec §5/§12): supplied via user-secrets locally and Azure Key Vault in
/// production (WP-7). <see cref="Currency"/> defaults to NZD for this NZ-based business.
/// </summary>
public sealed class StripeOptions
{
    public const string SectionName = "Stripe";

    /// <summary>Stripe secret key. Empty in repo — user-secrets / Key Vault only.</summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Stripe webhook signing secret (whsec_...) used to verify the <c>Stripe-Signature</c> header on
    /// <c>POST /api/webhooks/stripe</c> (spec §5/§8/§12). The webhook is the single source of truth for
    /// payment success, so this MUST be set in any environment that processes real payments. Empty in
    /// the repo — supplied via user-secrets locally / Key Vault in production (WP-7).
    /// </summary>
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>ISO currency code for PaymentIntents.</summary>
    public string Currency { get; set; } = "nzd";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(SecretKey);

    /// <summary>True only when a webhook signing secret is present (enables signature verification).</summary>
    public bool IsWebhookConfigured => !string.IsNullOrWhiteSpace(WebhookSecret);
}
