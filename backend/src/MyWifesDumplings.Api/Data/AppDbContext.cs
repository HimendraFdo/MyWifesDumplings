using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Data;

/// <summary>
/// Application database context. Extends <see cref="IdentityDbContext{TUser}"/> so ASP.NET Core
/// Identity tables (users, roles, claims, ...) live in the same Azure SQL database as the
/// transactional Order/OrderItem tables.
/// </summary>
public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity needs its mappings configured first.
        base.OnModelCreating(builder);

        builder.Entity<Order>(order =>
        {
            // Nullable UserId FK: NULL = guest order. SetNull keeps the order if the user
            // is deleted (guest-ification is safe).
            order.HasOne(o => o.User)
                 .WithMany(u => u.Orders)
                 .HasForeignKey(o => o.UserId)
                 .OnDelete(DeleteBehavior.SetNull);

            // Order -> OrderItem one-to-many; deleting an order removes its items.
            order.HasMany(o => o.OrderItems)
                 .WithOne(i => i.Order)
                 .HasForeignKey(i => i.OrderId)
                 .OnDelete(DeleteBehavior.Cascade);

            order.Property(o => o.CustomerEmail).IsRequired().HasMaxLength(256);
            order.Property(o => o.GuestLookupToken).IsRequired().HasMaxLength(128);
            order.Property(o => o.StripePaymentIntentId).HasMaxLength(256);

            order.HasIndex(o => o.GuestLookupToken);
        });

        builder.Entity<OrderItem>(item =>
        {
            item.Property(i => i.MenuItemId).IsRequired().HasMaxLength(128);
            item.Property(i => i.NameSnapshot).IsRequired().HasMaxLength(256);
            item.Property(i => i.UnitPriceSnapshot).HasPrecision(10, 2);
        });
    }
}
