/**
 * Server-only: backend base URL and headers (JWT from cookie, optional x-api-key).
 * Used by API route handlers only.
 */

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "https://voice-scheduling-gent.onrender.com/api/v1";

export function getBackendUrl(path: string, search?: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  const url = `${BASE.replace(/\/$/, "")}/${p}`;
  return search ? `${url}?${search}` : url;
}

export async function getBackendHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const apiKey = process.env.BACKEND_API_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

export async function proxyToBackend(
  path: string,
  init: RequestInit & { search?: string }
): Promise<Response> {
  const { search, ...fetchInit } = init;
  const url = getBackendUrl(path, search);
  const headers = await getBackendHeaders(
    (fetchInit.headers as Record<string, string>) || {}
  );
  return fetch(url, {
    ...fetchInit,
    headers: { ...headers, ...(fetchInit.headers as Record<string, string>) },
  });
}
