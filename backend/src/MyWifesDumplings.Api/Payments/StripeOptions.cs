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

    /// <summary>ISO currency code for PaymentIntents.</summary>
    public string Currency { get; set; } = "nzd";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(SecretKey);
}
