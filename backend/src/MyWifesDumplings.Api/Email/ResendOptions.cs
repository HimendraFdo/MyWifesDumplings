namespace MyWifesDumplings.Api.Email;

/// <summary>
/// Configuration for the Resend-backed confirmation email service. Bound from the "Resend" section.
/// <see cref="ApiKey"/> is a SECRET and is left EMPTY in the repo (spec §2/§5/§12) — supplied via
/// user-secrets locally / Key Vault in production (WP-7). <see cref="FromAddress"/> must be a verified
/// Resend sender. <see cref="LookupBaseUrl"/> is the public base used to build the guest order-lookup
/// link emailed to guests (a placeholder is fine until the frontend route is wired in WP-8).
/// </summary>
public sealed class ResendOptions
{
    public const string SectionName = "Resend";

    /// <summary>Resend API key (re_...). Empty in repo — user-secrets / Key Vault only.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Verified sender address for confirmation emails.</summary>
    public string FromAddress { get; set; } = "mywifesdumplingsofficial@gmail.com";

    /// <summary>
    /// Public base URL for the guest order-lookup link: <c>{LookupBaseUrl}/{GuestLookupToken}</c>
    /// (matches the future <c>GET /api/orders/lookup/{token}</c> / frontend route, WP-6/WP-8).
    /// </summary>
    public string LookupBaseUrl { get; set; } = "https://mywifesdumplings.co.nz/order/lookup";

    /// <summary>True only when the API key needed to call Resend is present.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
