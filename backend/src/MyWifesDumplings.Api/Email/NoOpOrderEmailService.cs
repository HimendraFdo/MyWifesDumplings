using MyWifesDumplings.Api.Entities;

namespace MyWifesDumplings.Api.Email;

/// <summary>
/// DEVELOPMENT-ONLY fallback: logs the confirmation instead of sending it, so the app composes and
/// tests run without Resend credentials. It mirrors the dev stub pattern used for the menu price
/// provider (see Program.cs) and must NEVER be the production default — the host registers the real
/// <see cref="ResendOrderEmailService"/> whenever Resend is configured and fails fast in a
/// non-Development environment when it is not.
/// </summary>
public sealed class NoOpOrderEmailService : IOrderEmailService
{
    private readonly ILogger<NoOpOrderEmailService> _logger;

    public NoOpOrderEmailService(ILogger<NoOpOrderEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendOrderConfirmationAsync(Order order, CancellationToken ct)
    {
        _logger.LogInformation(
            "[DEV no-op email] Would send order confirmation for order {OrderId} to {Email} " +
            "(guest lookup token: {Token}).",
            order.Id, order.CustomerEmail, order.GuestLookupToken);
        return Task.CompletedTask;
    }
}
