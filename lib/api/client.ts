/**
 * Client-side fetch wrapper: only calls Next.js routes (/api/*), never backend directly.
 * Credentials included so httpOnly cookie is sent.
 */

const API = ""; // same origin

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestConfig {
  method?: Method;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  cache?: RequestCache;
}

async function request<T>(
  path: string,
  { method = "GET", body, headers = {}, idempotencyKey, cache = "no-store" }: RequestConfig = {}
): Promise<T> {
  const h: Record<string, string> = { ...headers };
  if (body !== undefined && body !== null) {
    h["Content-Type"] = "application/json";
  }
  if (idempotencyKey) {
    h["x-idempotency-key"] = idempotencyKey;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: "include",
    cache,
    headers: h,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const err = data as { error?: { message?: string }; message?: string };
    const msg =
      (err as { error?: { message?: string } })?.error?.message ||
      (err as { message?: string })?.message ||
      res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data as T;
}

// Auth (Next route forwards to backend with API key; sets httpOnly cookie)
export const apiAuth = {
  login: (email: string) =>
    request<{ token?: string; user?: { email: string } }>("/api/auth/login", {
      method: "POST",
      body: { email },
    }),
};

// Sessions (via Next proxy so JWT cookie is sent)
export const apiSessions = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    const query = q.toString();
    return request<{ data?: { sessions?: unknown[]; pagination?: unknown }; success?: boolean }>(
      `/api/proxy/sessions${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );
  },
  get: (id: string) =>
    request<{ data?: unknown; success?: boolean }>(`/api/proxy/sessions/${id}`, {
      cache: "no-store",
    }),
  create: (body: Record<string, unknown>) =>
    request<{ data?: unknown; success?: boolean }>("/api/proxy/sessions", {
      method: "POST",
      body,
    }),
  update: (id: string, body: Record<string, unknown>) =>
    request<{ data?: unknown; success?: boolean }>(`/api/proxy/sessions/${id}`, {
      method: "PATCH",
      body,
    }),
  delete: (id: string) =>
    request<{ data?: unknown; success?: boolean }>(`/api/proxy/sessions/${id}`, {
      method: "DELETE",
    }),
};

// Events
function eventIdempotencyKey(p: {
  sessionId?: string;
  startIso: string;
  title: string;
  attendeeEmail?: string;
}): string {
  const str = [p.sessionId, p.startIso, p.title, p.attendeeEmail].filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return `evt-${Math.abs(h).toString(36)}-${Date.now()}`;
}

export const apiEvents = {
  list: (params?: { sessionId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.sessionId) q.set("sessionId", params.sessionId);
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    const query = q.toString();
    return request<{ data?: unknown[]; success?: boolean }>(
      `/api/proxy/events${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );
  },
  get: (id: string) =>
    request<{ data?: unknown; success?: boolean }>(`/api/proxy/events/${id}`, {
      cache: "no-store",
    }),
  delete: (id: string) =>
    request<{ data?: unknown; success?: boolean }>(`/api/proxy/events/${id}`, {
      method: "DELETE",
    }),
  create: (
    body: Record<string, unknown>,
    options?: { idempotencyKey?: string }
  ) =>
    request<{ data?: unknown; success?: boolean }>("/api/proxy/events", {
      method: "POST",
      body,
      idempotencyKey:
        options?.idempotencyKey ??
        eventIdempotencyKey({
          sessionId: body.sessionId as string,
          startIso: body.startIso as string,
          title: body.title as string,
          attendeeEmail: body.attendeeEmail as string,
        }),
    }),
};

// Webhook tester (dev)
export const apiWebhook = {
  voice: (body: Record<string, unknown>) =>
    request<unknown>("/api/proxy/webhooks/voice", {
      method: "POST",
      body,
    }),
};

// Voice parse (OpenAI-enhanced; falls back to client parsing if no key)
export const apiVoice = {
  parse: (body: {
    transcript: string;
    step: string;
    context?: { attendeeName?: string; startIso?: string };
  }) =>
    request<{ name?: string; startIso?: string; title?: string; useFallback?: boolean }>(
      "/api/voice/parse",
      { method: "POST", body }
    ),
};
