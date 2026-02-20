import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/api/auth";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://voice-scheduling-gent.onrender.com/api/v1";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON" } },
      { status: 400 }
    );
  }
  const email = body?.email?.trim();
  if (!email) {
    return NextResponse.json(
      { success: false, error: { message: "Email is required" } },
      { status: 400 }
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.BACKEND_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(`${BASE.replace(/\/$/, "")}/auth/login`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(data || { success: false, error: { message: res.statusText } }, {
      status: res.status,
    });
  }

  // Backend returns { success: true, data: { token, user } }
  const payload = data?.data ?? data;
  const token = payload?.token ?? data?.token;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "No token in response" } },
      { status: 502 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json(payload);
}
