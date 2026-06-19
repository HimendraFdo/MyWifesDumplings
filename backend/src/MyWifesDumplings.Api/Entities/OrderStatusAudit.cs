namespace MyWifesDumplings.Api.Entities;

public class OrderStatusAudit
{
    public long Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string AdminUserId { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public OrderStatus PreviousStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public DateTime ChangedAtUtc { get; set; }
}
