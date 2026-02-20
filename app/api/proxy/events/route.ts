import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/api/backend";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const res = await proxyToBackend(`events${search ? `?${search}` : ""}`, {
    method: "GET",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const idempotencyKey = request.headers.get("x-idempotency-key") ?? undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idempotencyKey) headers["x-idempotency-key"] = idempotencyKey;
  const res = await proxyToBackend("events", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
