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
  const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE || "https://voice-scheduling-gent.onrender.com/api/v1"}/sessions`;
  console.log("body", body);
  console.log("[create sessions] POST", backendUrl, "body:", JSON.stringify(body, null, 2));
  const res = await proxyToBackend("sessions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  console.log("[create sessions] response", res.status, data?.data ?? data);
  return NextResponse.json(data, { status: res.status });
}
