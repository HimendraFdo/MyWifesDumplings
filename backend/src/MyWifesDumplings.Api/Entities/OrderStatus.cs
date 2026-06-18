namespace MyWifesDumplings.Api.Entities;

/// <summary>
/// Order lifecycle: NotStarted (paid, just in) -> Ongoing (kitchen making it)
/// -> Completed (ready / picked up / done). See spec §7.
/// </summary>
public enum OrderStatus
{
    NotStarted = 0,
    Ongoing = 1,
    Completed = 2
}
