import type {
  AuthResponse,
  ChangePasswordRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  LoginRequest,
  OrderStatus,
  OrderSummary,
  OrderStatusAudit,
  RegisterRequest,
} from "./types";
import { ORDER_STATUS_VALUE } from "./types";

/**
 * Typed client for the .NET ordering/payments API (spec §8).
 *
 * - Base URL comes from NEXT_PUBLIC_API_BASE_URL (configurable per environment).
 * - When a JWT is supplied it is attached as `Authorization: Bearer <jwt>`.
 * - The client NEVER sends prices/totals — only { menuItemId, quantity } (spec §12).
 *   Card data never touches this client; it goes browser → Stripe directly (spec §5).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Error carrying the HTTP status so callers can branch on 401/403/409 etc. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      "NEXT_PUBLIC_API_BASE_URL is not configured. Set it in your environment to reach the ordering API.",
    );
  }

  const { method = "GET", body, token, signal } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Could not reach the server. Please try again.");
  }

  const text = await res.text();
  const parsed = text ? safeJson(text) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, extractError(parsed) ?? res.statusText, parsed);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Pulls a human-readable message out of the API's various error shapes. */
function extractError(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") return b.error;
  if (typeof b.title === "string") return b.title;
  if (b.errors && typeof b.errors === "object") {
    const first = Object.values(b.errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return undefined;
}

export const api = {
  // --- Orders (public; guest + customer share the same path, spec §4) ---
  createOrder(payload: CreateOrderRequest, token?: string | null) {
    return request<CreateOrderResponse>("/api/orders", {
      method: "POST",
      body: payload,
      token,
    });
  },

  lookupOrder(token: string, signal?: AbortSignal) {
    return request<OrderSummary>(
      `/api/orders/lookup/${encodeURIComponent(token)}`,
      { signal },
    );
  },

  // --- Auth (public) ---
  register(payload: RegisterRequest) {
    return request<{ id: string; email: string; role: string }>(
      "/api/auth/register",
      { method: "POST", body: payload },
    );
  },

  login(payload: LoginRequest) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  // --- Customer (authenticated) ---
  myOrders(token: string, signal?: AbortSignal) {
    return request<OrderSummary[]>("/api/me/orders", { token, signal });
  },

  // --- Admin (Admin-role JWT required) ---
  adminOrders(
    token: string,
    options?: {
      status?: OrderStatus;
      search?: string;
      signal?: AbortSignal;
    },
  ) {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.search?.trim()) params.set("search", options.search.trim());
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return request<OrderSummary[]>(`/api/admin/orders${qs}`, {
      token,
      signal: options?.signal,
    });
  },

  updateOrderStatus(id: number, status: OrderStatus, token: string) {
    // The API binds OrderStatus by its integer value (no string-enum converter), so
    // send the numeric form (spec §7 enum: NotStarted=0, Ongoing=1, Completed=2).
    return request<OrderSummary>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: { status: ORDER_STATUS_VALUE[status] },
      token,
    });
  },

  getOrderAudit(id: number, token: string, signal?: AbortSignal) {
    return request<OrderStatusAudit[]>(`/api/admin/orders/${id}/audit`, {
      token,
      signal,
    });
  },

  changeAdminPassword(payload: ChangePasswordRequest, token: string) {
    return request<void>("/api/admin/change-password", {
      method: "POST",
      body: payload,
      token,
    });
  },
};
