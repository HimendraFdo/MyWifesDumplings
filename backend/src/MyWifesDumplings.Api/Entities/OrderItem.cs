namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// A single line in an order. Stores name and unit-price SNAPSHOTS taken at order time so
/// historical orders stay correct even after the Sanity menu changes (spec §6, §12).
/// <see cref="MenuItemId"/> is just a reference to a Sanity item — no menu data is duplicated
/// into SQL; Sanity remains the menu source of truth.
/// </summary>
public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    /// <summary>Reference to the Sanity menu item (string id). Not a FK to any SQL table.</summary>
    public string MenuItemId { get; set; } = string.Empty;

    /// <summary>Item name at time of order.</summary>
    public string NameSnapshot { get; set; } = string.Empty;

    /// <summary>Unit price at time of order.</summary>
    public decimal UnitPriceSnapshot { get; set; }

    public int Quantity { get; set; }
}
