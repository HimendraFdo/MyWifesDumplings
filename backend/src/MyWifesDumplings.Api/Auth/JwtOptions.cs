namespace MyWifesDumplings.Api.Auth;

/// <summary>
/// Strongly-typed JWT settings bound from the <c>Jwt</c> configuration section.
/// The signing key is supplied per-environment: a clearly-marked dev placeholder in
/// appsettings.Development.json locally, and Azure Key Vault in production (WP-7).
/// A real signing secret is NEVER committed to source.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;

    /// <summary>HMAC-SHA256 signing key. Must be at least 32 bytes (256 bits) to be valid.</summary>
    public string SigningKey { get; init; } = string.Empty;

    public int ExpiryMinutes { get; init; } = 120;
}
