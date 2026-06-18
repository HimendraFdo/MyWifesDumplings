using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Auth;

/// <summary>Issues signed JWTs for authenticated users.</summary>
public interface ITokenService
{
    /// <summary>
    /// Issues a signed JWT for the given user, embedding the subject (user id), email, and the
    /// supplied role claims so <c>[Authorize(Roles = "Admin")]</c> / role policies work.
    /// </summary>
    /// <returns>The encoded JWT string and its UTC expiry.</returns>
    (string Token, DateTime ExpiresAtUtc) CreateToken(ApplicationUser user, IEnumerable<string> roles);
}
