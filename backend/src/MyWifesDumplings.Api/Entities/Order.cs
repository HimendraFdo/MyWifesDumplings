namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// A customer order. A NULL <see cref="UserId"/> denotes a guest order — this is the
/// mechanism that unifies guest and account checkout into a single code path (spec §6).
/// </summary>
public class Order
{
    public int Id { get; set; }

    /// <summary>
    /// Owning user. NULL = guest order. SetNull on user delete keeps the order intact.
    /// </summary>
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    /// <summary>Always captured — used for the confirmation email and guest lookup.</summary>
    public string CustomerEmail { get; set; } = string.Empty;

    /// <summary>
    /// The chosen dumpling type for this order (e.g. "Pork n Chives"). Order-level metadata —
    /// it does NOT affect pricing (pricing is by quantity tier), so it is captured from the
    /// request like <see cref="CustomerEmail"/> rather than re-priced. Nullable for legacy orders.
    /// </summary>
    public string? Flavour { get; set; }

    /// <summary>Random token letting a guest view their order via an emailed link.</summary>
    public string GuestLookupToken { get; set; } = string.Empty;

    public OrderStatus Status { get; set; } = OrderStatus.NotStarted;

    /// <summary>Stripe PaymentIntent id; null until a PaymentIntent is created (WP-4).</summary>
    public string? StripePaymentIntentId { get; set; }

    /// <summary>Set when the Stripe webhook confirms payment (WP-5); null until paid.</summary>
    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusAudit> StatusAudits { get; set; } = new List<OrderStatusAudit>();
}
