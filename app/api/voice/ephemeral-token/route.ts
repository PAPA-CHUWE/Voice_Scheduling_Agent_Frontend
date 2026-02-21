import { NextResponse } from "next/server";

/**
 * POST /api/voice/ephemeral-token
 * Generates an ephemeral client secret for OpenAI Realtime API.
 * Uses OPENAI_API_KEY server-side - key is never exposed to the client.
 * Returns { value: "ek_..." } for use with RealtimeSession.connect().
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  const sessionConfig = {
    session: {
      type: "realtime" as const,
      model: "gpt-realtime",
      audio: {
        output: { voice: "marin" as const },
      },
    },
  };

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionConfig),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { error?: { message?: string } })?.error?.message || "Failed to create ephemeral token" },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { value?: string };
  const value = data?.value;
  if (!value || typeof value !== "string") {
    return NextResponse.json(
      { error: "Invalid response from OpenAI" },
      { status: 500 }
    );
  }

  return NextResponse.json({ value });
}
