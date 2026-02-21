import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ useFallback: true }, { status: 200 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { transcript, step, context } = body as {
      transcript?: string;
      step?: string;
      context?: { attendeeName?: string; startIso?: string };
    };

    if (!transcript || typeof transcript !== "string" || transcript.length < 2) {
      return NextResponse.json({ useFallback: true }, { status: 200 });
    }

    const systemPrompt = `You are a voice scheduling assistant. Extract structured data from the user's speech.
Return JSON only, no markdown. Keys: name, startIso (ISO 8601), title.
- name: person's name (for step name/greeting)
- startIso: datetime as ISO string, timezone Africa/Harare (for step date/time)
- title: meeting title (for step title)
If unable to extract, return {"useFallback": true}.
Use current context: ${JSON.stringify(context || {})}.
Today is ${new Date().toISOString().slice(0, 10)}.`;

    const userPrompt = `Step: ${step}. User said: "${transcript}". Extract JSON:`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("[voice/parse] OpenAI error:", res.status, err);
      return NextResponse.json({ useFallback: true }, { status: 200 });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ useFallback: true }, { status: 200 });

    const parsed = JSON.parse(content.replace(/^```\w*\n?|\n?```$/g, "").trim()) as {
      name?: string;
      startIso?: string;
      title?: string;
      useFallback?: boolean;
    };

    if (parsed.useFallback) return NextResponse.json({ useFallback: true }, { status: 200 });
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ useFallback: true }, { status: 200 });
  }
}
