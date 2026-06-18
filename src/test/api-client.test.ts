import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The client reads NEXT_PUBLIC_API_BASE_URL once at module load, so set it before importing.
vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");

const { api, ApiError } = await import("@/lib/api/client");

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(async () =>
    new Response(body === undefined ? "" : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("api client", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.restoreAllMocks());

  it("createOrder posts a price-free payload and no Authorization header for guests", async () => {
    const fetchMock = mockFetch(200, { orderId: 7, clientSecret: "cs_test_123" });

    const res = await api.createOrder({
      customerEmail: "guest@example.com",
      items: [{ menuItemId: "tier_60", quantity: 1 }],
    });

    expect(res).toEqual({ orderId: 7, clientSecret: "cs_test_123" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/orders");
    expect(init.method).toBe("POST");
    // Guest path: no token => no Authorization header (spec §4).
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();

    const sent = JSON.parse(init.body as string);
    expect(sent).toEqual({
      customerEmail: "guest@example.com",
      items: [{ menuItemId: "tier_60", quantity: 1 }],
    });
    // Guardrail: the serialized request body carries no pricing field.
    expect((init.body as string).toLowerCase()).not.toContain("price");
  });

  it("attaches Authorization: Bearer <jwt> when a token is supplied", async () => {
    const fetchMock = mockFetch(200, []);

    await api.myOrders("jwt-abc");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/me/orders");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer jwt-abc",
    );
  });

  it("sends the status filter and bearer token on the admin list", async () => {
    const fetchMock = mockFetch(200, []);

    await api.adminOrders("admin-jwt", "Ongoing");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/admin/orders?status=Ongoing");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-jwt",
    );
  });

  it("PATCH status sends the NUMERIC enum value (the API has no string-enum converter)", async () => {
    const fetchMock = mockFetch(200, {});

    await api.updateOrderStatus(42, "Completed", "admin-jwt");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/orders/42/status");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: 2 }); // Completed = 2
  });

  it("throws ApiError carrying the HTTP status on failure", async () => {
    mockFetch(403, { error: "Forbidden" });

    await expect(api.adminOrders("not-admin")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Forbidden",
    });
    expect(ApiError).toBeDefined();
  });
});
