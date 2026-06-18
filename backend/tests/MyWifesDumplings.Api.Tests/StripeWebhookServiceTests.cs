using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Email;
using MyWifesDumplings.Api.Entities;
using MyWifesDumplings.Api.Payments;
using Xunit;

namespace MyWifesDumplings.Api.Tests;

/// <summary>
/// Proves the WP-5 acceptance criteria (spec §5/§7/§8/§12) without a live SQL Server, Stripe, or
/// Resend: an EF Core InMemory DbContext stands in for the database, a mocked
/// <see cref="IOrderEmailService"/> stands in for Resend, and valid Stripe signatures are computed
/// locally using Stripe's documented scheme (t=&lt;ts&gt;,v1=&lt;HMACSHA256(ts.payload, secret)&gt;).
///
/// Covered:
///   (a) a valid signature marks the matching order paid (PaidAt set, Status = NotStarted);
///   (b) a tampered/garbage signature is rejected (400) and mutates nothing;
///   (c) idempotency — the same valid event delivered twice marks paid once, no-op the second time;
///   (d) an email send failure does not prevent the order being marked paid;
///   (e) payment state is set ONLY in the webhook path (an unknown PaymentIntent leaves orders untouched).
/// </summary>
public class StripeWebhookServiceTests
{
    private const string WebhookSecret = "whsec_test_secret_for_unit_tests";

    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"webhook-tests-{Guid.NewGuid()}")
            .Options);

    private static StripeWebhookService BuildSut(AppDbContext db, IOrderEmailService email, string secret = WebhookSecret)
    {
        var options = new StripeOptions { WebhookSecret = secret };
        return new StripeWebhookService(db, email, options, NullLogger<StripeWebhookService>.Instance);
    }

    private static Mock<IOrderEmailService> EmailMock()
    {
        var mock = new Mock<IOrderEmailService>();
        mock.Setup(e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        return mock;
    }

    private static Order SeedOrder(AppDbContext db, string paymentIntentId)
    {
        var order = new Order
        {
            CustomerEmail = "guest@example.com",
            GuestLookupToken = "tok-123",
            StripePaymentIntentId = paymentIntentId,
            Status = OrderStatus.NotStarted,
            PaidAt = null,
        };
        db.Orders.Add(order);
        db.SaveChanges();
        return order;
    }

    /// <summary>Builds a payment_intent.succeeded event payload referencing the given PaymentIntent id.</summary>
    private static string PaymentSucceededPayload(string paymentIntentId) =>
        EventPayload("payment_intent.succeeded", paymentIntentId);

    /// <summary>
    /// Builds a realistic <c>payment_intent.payment_failed</c> envelope — the event Stripe actually sends
    /// when a card is declined (e.g. the <c>4000 0000 0000 0002</c> generic-decline test card). The
    /// PaymentIntent's status is <c>requires_payment_method</c> and it carries a <c>last_payment_error</c>
    /// with <c>decline_code: generic_decline</c>, mirroring the live payload our endpoint would receive.
    /// </summary>
    private static string PaymentFailedPayload(string paymentIntentId) =>
        $$"""
        {
          "id": "evt_test_declined",
          "object": "event",
          "api_version": "2024-06-20",
          "created": 1700000000,
          "livemode": false,
          "pending_webhooks": 1,
          "request": { "id": null, "idempotency_key": null },
          "type": "payment_intent.payment_failed",
          "data": { "object": {
            "id": "{{paymentIntentId}}",
            "object": "payment_intent",
            "status": "requires_payment_method",
            "last_payment_error": {
              "type": "card_error",
              "code": "card_declined",
              "decline_code": "generic_decline",
              "message": "Your card was declined."
            }
          } }
        }
        """;

    /// <summary>
    /// Builds a realistic Stripe event envelope (the fields Stripe.net's deserializer expects), with a
    /// PaymentIntent as the data object.
    /// </summary>
    private static string EventPayload(string type, string paymentIntentId) =>
        $$"""
        {
          "id": "evt_test_123",
          "object": "event",
          "api_version": "2024-06-20",
          "created": 1700000000,
          "livemode": false,
          "pending_webhooks": 1,
          "request": { "id": null, "idempotency_key": null },
          "type": "{{type}}",
          "data": { "object": { "id": "{{paymentIntentId}}", "object": "payment_intent", "status": "succeeded" } }
        }
        """;

    /// <summary>Computes a valid Stripe-Signature header for <paramref name="payload"/> using Stripe's scheme.</summary>
    private static string SignaturedHeader(string payload, string secret)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signedPayload = $"{timestamp}.{payload}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        var signature = Convert.ToHexString(hash).ToLowerInvariant();
        return $"t={timestamp},v1={signature}";
    }

    [Fact]
    public async Task ValidSignature_MarksOrderPaid_And_SetsStatusNotStarted()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_valid_1");
        var email = EmailMock();
        var sut = BuildSut(db, email.Object);

        var payload = PaymentSucceededPayload("pi_valid_1");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        Assert.Equal(WebhookOutcome.Acknowledged, result.Outcome);

        var updated = await db.Orders.FindAsync(order.Id);
        Assert.NotNull(updated!.PaidAt);
        Assert.Equal(OrderStatus.NotStarted, updated.Status);
        email.Verify(e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TamperedSignature_IsRejected_And_OrderUnchanged()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_tamper");
        var email = EmailMock();
        var sut = BuildSut(db, email.Object);

        var payload = PaymentSucceededPayload("pi_tamper");
        // Garbage signature header — not derived from the secret.
        var result = await sut.ProcessAsync(payload, "t=123,v1=deadbeef", CancellationToken.None);

        Assert.Equal(WebhookOutcome.InvalidSignature, result.Outcome);

        var unchanged = await db.Orders.FindAsync(order.Id);
        Assert.Null(unchanged!.PaidAt);
        email.Verify(e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidSignatureForWrongSecret_IsRejected()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_wrongsecret");
        var email = EmailMock();
        var sut = BuildSut(db, email.Object);

        var payload = PaymentSucceededPayload("pi_wrongsecret");
        // Correctly-formed signature, but computed with a DIFFERENT secret than the service trusts.
        var header = SignaturedHeader(payload, "whsec_some_other_secret");

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        Assert.Equal(WebhookOutcome.InvalidSignature, result.Outcome);
        Assert.Null((await db.Orders.FindAsync(order.Id))!.PaidAt);
    }

    [Fact]
    public async Task MissingSignatureHeader_IsRejected()
    {
        using var db = NewDb();
        SeedOrder(db, "pi_nosig");
        var sut = BuildSut(db, EmailMock().Object);

        var payload = PaymentSucceededPayload("pi_nosig");
        var result = await sut.ProcessAsync(payload, signatureHeader: null, CancellationToken.None);

        Assert.Equal(WebhookOutcome.InvalidSignature, result.Outcome);
    }

    [Fact]
    public async Task UnconfiguredWebhookSecret_IsRejected()
    {
        using var db = NewDb();
        SeedOrder(db, "pi_unconfigured");
        // No webhook secret configured at all -> cannot verify -> reject.
        var sut = BuildSut(db, EmailMock().Object, secret: "");

        var payload = PaymentSucceededPayload("pi_unconfigured");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        Assert.Equal(WebhookOutcome.InvalidSignature, result.Outcome);
    }

    [Fact]
    public async Task SameEvent_DeliveredTwice_MarksPaidOnce_SecondIsNoOp()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_idem");
        var email = EmailMock();
        var sut = BuildSut(db, email.Object);

        var payload = PaymentSucceededPayload("pi_idem");
        var header = SignaturedHeader(payload, WebhookSecret);

        var first = await sut.ProcessAsync(payload, header, CancellationToken.None);
        var paidAtAfterFirst = (await db.Orders.FindAsync(order.Id))!.PaidAt;

        // Redeliver the same signed event.
        var second = await sut.ProcessAsync(payload, header, CancellationToken.None);
        var paidAtAfterSecond = (await db.Orders.FindAsync(order.Id))!.PaidAt;

        Assert.Equal(WebhookOutcome.Acknowledged, first.Outcome);
        Assert.Equal(WebhookOutcome.Acknowledged, second.Outcome);
        Assert.NotNull(paidAtAfterFirst);
        // PaidAt is unchanged by the redelivery — not re-stamped.
        Assert.Equal(paidAtAfterFirst, paidAtAfterSecond);
        // Email is only sent on the first (real) processing, never on the no-op redelivery.
        email.Verify(e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EmailFailure_DoesNotPreventOrderBeingMarkedPaid()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_emailfail");
        var email = new Mock<IOrderEmailService>();
        email.Setup(e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
             .ThrowsAsync(new InvalidOperationException("Resend is down"));
        var sut = BuildSut(db, email.Object);

        var payload = PaymentSucceededPayload("pi_emailfail");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        // The confirmed payment survives even though the email threw.
        Assert.Equal(WebhookOutcome.Acknowledged, result.Outcome);
        var updated = await db.Orders.FindAsync(order.Id);
        Assert.NotNull(updated!.PaidAt);
        Assert.Equal(OrderStatus.NotStarted, updated.Status);
    }

    [Fact]
    public async Task UnknownPaymentIntent_IsAcknowledged_And_NoOrderMutated()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_known");
        var sut = BuildSut(db, EmailMock().Object);

        // Valid signature, but the PaymentIntent maps to no order we know about.
        var payload = PaymentSucceededPayload("pi_does_not_exist");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        Assert.Equal(WebhookOutcome.Acknowledged, result.Outcome);
        // The unrelated order is untouched — payment state is set only for the matching PI.
        Assert.Null((await db.Orders.FindAsync(order.Id))!.PaidAt);
    }

    [Fact]
    public async Task DeclinedCard_PaymentFailed_LeavesOrderUnpaid_And_SendsNoEmail()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_declined");
        var email = EmailMock();
        var sut = BuildSut(db, email.Object);

        // End-to-end decline: a customer pays with the 4000 0000 0000 0002 generic-decline card.
        // Stripe never sends payment_intent.succeeded for a decline — it sends payment_intent.payment_failed.
        var payload = PaymentFailedPayload("pi_declined");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        // Acknowledged (200) so Stripe stops retrying, but NOTHING about the order changes.
        Assert.Equal(WebhookOutcome.Acknowledged, result.Outcome);
        var unchanged = await db.Orders.FindAsync(order.Id);
        Assert.Null(unchanged!.PaidAt);                       // never marked paid
        Assert.Equal(OrderStatus.NotStarted, unchanged.Status); // status untouched
        // No confirmation email may go out for a payment that did not succeed.
        email.Verify(
            e => e.SendOrderConfirmationAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UnhandledEventType_IsAcknowledged_And_NoOrderMutated()
    {
        using var db = NewDb();
        var order = SeedOrder(db, "pi_other");
        var sut = BuildSut(db, EmailMock().Object);

        var payload = EventPayload("payment_intent.payment_failed", "pi_other");
        var header = SignaturedHeader(payload, WebhookSecret);

        var result = await sut.ProcessAsync(payload, header, CancellationToken.None);

        Assert.Equal(WebhookOutcome.Acknowledged, result.Outcome);
        Assert.Null((await db.Orders.FindAsync(order.Id))!.PaidAt);
    }
}
