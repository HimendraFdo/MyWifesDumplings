using Microsoft.EntityFrameworkCore;

namespace MyWifesDumplings.Api.Data;

/// <summary>
/// Application database context. Entities (User/Order/OrderItem) are added in WP-2.
/// Kept intentionally empty in WP-1 so the app can establish a SQL connection.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
}
