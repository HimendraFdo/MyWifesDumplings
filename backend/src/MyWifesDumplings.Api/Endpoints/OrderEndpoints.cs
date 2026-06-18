using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MyWifesDumplings.Api.Data;
using MyWifesDumplings.Api.Orders;
using MyWifesDumplings.Api.Payments;

namespace MyWifesDumplings.Api.Endpoints;

/// <summary>
/// Orders core (WP-4, spec §8): <c>POST /api/orders</c>. Public — works for guests and logged-in
/// customers via the SAME code path. Computes the total server-side, creates a Stripe PaymentIntent,
/// persists an UNPAID order, and returns the order id + client secret. Does NOT confirm payment.
/// </summary>
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        // Public: no [Authorize]. If a valid JWT is present it is honoured (stamps UserId); if not,
        // the order is created as a guest order. Either way the flow is identical (spec §4).
        app.MapPost("/api/orders", async (
            CreateOrderRequest request,
            ClaimsPrincipal principal,
            OrderCreationService orderBuilder,
            IPaymentIntentService payments,
            AppDbContext db,
            StripeOptions stripeOptions,
            CancellationToken ct) =>
        {
            if (!TryValidate(request, out var validationErrors))
            {
                return Results.ValidationProblem(validationErrors);
            }

            // Identity from the token subject if authenticated; null => guest (spec §4/§6).
            var userId = principal.Identity?.IsAuthenticated == true
                ? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            // Server-side pricing + snapshots. Unknown ids / bad quantities => 400.
            var build = await orderBuilder.BuildAsync(request, userId, ct);
            if (!build.Succeeded)
            {
                return Results.BadRequest(new { error = build.Error });
            }

            var order = build.Order!;

            // Persist first so we have an order id to put in the Stripe metadata.
            db.Orders.Add(order);
            await db.SaveChangesAsync(ct);

            try
            {
                var metadata = new Dictionary<string, string>
                {
                    ["orderId"] = order.Id.ToString(),
                };

                var intent = await payments.CreateAsync(
                    build.AmountMinorUnits, stripeOptions.Currency, metadata, ct);

                order.StripePaymentIntentId = intent.PaymentIntentId;
                await db.SaveChangesAsync(ct);

                // Order remains UNPAID (PaidAt == null). Payment is confirmed only by the webhook (WP-5).
                return Results.Ok(new CreateOrderResponse(order.Id, intent.ClientSecret));
            }
            catch (Exception)
            {
                // Roll back the half-created order if Stripe fails — no orphan unpaid order with no intent.
                db.Orders.Remove(order);
                await db.SaveChangesAsync(ct);
                return Results.Problem(
                    title: "Could not initiate payment.",
                    statusCode: StatusCodes.Status502BadGateway);
            }
        })
        .WithName("CreateOrder")
        .WithTags("Orders")
        .WithOpenApi();

        return app;
    }

    private static bool TryValidate(object request, out Dictionary<string, string[]> errors)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        errors = new Dictionary<string, string[]>();

        if (Validator.TryValidateObject(request, context, results, validateAllProperties: true))
        {
            return true;
        }

        errors = results
            .SelectMany(r => r.MemberNames.DefaultIfEmpty(string.Empty)
                .Select(m => (Member: m, r.ErrorMessage)))
            .GroupBy(x => x.Member)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.ErrorMessage ?? "Invalid value.").ToArray());
        return false;
    }
}
