import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/api/auth";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://voice-scheduling-gent.onrender.com/api/v1";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  // Optionally validate token by calling backend; for now we only need to know if cookie exists.
  // If backend had GET /me we could call it. For simplicity we decode JWT payload (no verify) just for email display, or we could skip.
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8")
      ) as { email?: string; sub?: string };
      const email = payload.email ?? payload.sub ?? null;
      return NextResponse.json({ user: email ? { email } : null });
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ user: null }, { status: 200 });
}
