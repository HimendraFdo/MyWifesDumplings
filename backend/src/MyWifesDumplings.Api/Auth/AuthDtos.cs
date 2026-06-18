using System.ComponentModel.DataAnnotations;

namespace MyWifesDumplings.Api.Auth;

/// <summary>Registration request — always creates a <c>Customer</c> (§4).</summary>
public sealed record RegisterRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required, MinLength(8)] string Password);

/// <summary>Login request.</summary>
public sealed record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);

/// <summary>Issued on successful login.</summary>
public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, string Email, string[] Roles);
