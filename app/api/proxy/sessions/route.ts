import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/api/backend";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const res = await proxyToBackend(`sessions${search ? `?${search}` : ""}`, {
    method: "GET",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const res = await proxyToBackend("sessions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
