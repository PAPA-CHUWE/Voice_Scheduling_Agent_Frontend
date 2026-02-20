/**
 * Auth helpers for client: cookie is httpOnly so client only checks /api/me.
 * No token access in browser.
 */

export const AUTH_COOKIE_NAME = "vsa_token";

export async function getMe(): Promise<{ email?: string; user?: { email: string } } | null> {
  const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.user ? { ...json, email: json.user.email } : json;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
