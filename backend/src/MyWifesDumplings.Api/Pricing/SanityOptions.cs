namespace MyWifesDumplings.Api.Pricing;

/// <summary>
/// Configuration for the Sanity-backed menu price provider. Bound from the "Sanity" config section.
/// <see cref="ProjectId"/> / <see cref="Dataset"/> must be set for the real provider to be usable;
/// <see cref="Token"/> is optional (only needed for private datasets) and, like all secrets, is
/// supplied via user-secrets locally / Key Vault in production — never committed (spec §12).
/// </summary>
public sealed class SanityOptions
{
    public const string SectionName = "Sanity";

    public string ProjectId { get; set; } = string.Empty;
    public string Dataset { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "2024-01-01";

    /// <summary>Optional API token for private datasets. Never committed; user-secrets / Key Vault only.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>True only when the minimum config needed to call Sanity is present.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ProjectId) && !string.IsNullOrWhiteSpace(Dataset);
}
