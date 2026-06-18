using Microsoft.AspNetCore.Identity;

namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// Identity-managed application user. Roles (Customer/Admin) are assigned via
/// ASP.NET Core Identity role management (enforcement is WP-3).
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>
    /// Orders placed by this user while logged in. Guest orders have a NULL
    /// <see cref="Order.UserId"/> and are not part of any user's collection.
    /// </summary>
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
