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
    public DbSet<OrderStatusAudit> OrderStatusAudits => Set<OrderStatusAudit>();

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

            order.HasMany(o => o.StatusAudits)
                 .WithOne(a => a.Order)
                 .HasForeignKey(a => a.OrderId)
                 .OnDelete(DeleteBehavior.Cascade);

            order.Property(o => o.CustomerEmail).IsRequired().HasMaxLength(256);
            order.Property(o => o.GuestLookupToken).IsRequired().HasMaxLength(128);
            order.Property(o => o.StripePaymentIntentId).HasMaxLength(256);

            // Contact + fulfilment metadata (nullable; lengths mirror the request DTO caps).
            order.Property(o => o.CustomerName).HasMaxLength(120);
            order.Property(o => o.CustomerPhone).HasMaxLength(40);
            order.Property(o => o.DeliveryAddress).HasMaxLength(250);
            order.Property(o => o.DeliveryPostcode).HasMaxLength(20);
            order.Property(o => o.DeliveryNotes).HasMaxLength(500);
            order.Property(o => o.PreferredDay).HasMaxLength(60);
            order.Property(o => o.PreferredTime).HasMaxLength(60);
            // Method/Zone persist as ints (enum default). DeliveryFee mirrors the money precision.
            order.Property(o => o.DeliveryFee).HasPrecision(10, 2);

            order.HasIndex(o => o.GuestLookupToken);
        });

        builder.Entity<OrderItem>(item =>
        {
            item.Property(i => i.MenuItemId).IsRequired().HasMaxLength(128);
            item.Property(i => i.NameSnapshot).IsRequired().HasMaxLength(256);
            item.Property(i => i.UnitPriceSnapshot).HasPrecision(10, 2);
        });

        builder.Entity<OrderStatusAudit>(audit =>
        {
            audit.Property(a => a.AdminUserId).IsRequired().HasMaxLength(450);
            audit.Property(a => a.AdminEmail).IsRequired().HasMaxLength(256);
            audit.Property(a => a.ChangedAtUtc).IsRequired();
            audit.HasIndex(a => new { a.OrderId, a.ChangedAtUtc });
        });
    }
}
