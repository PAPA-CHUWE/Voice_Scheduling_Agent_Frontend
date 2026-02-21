"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeSession } from "@openai/agents/realtime";
import { createSchedulingAgent } from "./schedulingAgent";

export type RealtimeVoiceStatus = "idle" | "connecting" | "connected" | "error";

export interface RealtimeVoiceState {
  status: RealtimeVoiceStatus;
  error: string | null;
  history: Array<{ role: string; content?: string; type?: string }>;
  /** True when user is speaking / recently spoke (for mic activeness indicator) */
  userActive: boolean;
}

const DEFAULT_STATE: RealtimeVoiceState = {
  status: "idle",
  error: null,
  history: [],
  userActive: false,
};

function formatHistoryItem(item: { role?: string; type?: string; content?: Array<{ type: string; text?: string; transcript?: string | null }> }): { role: string; content?: string; type?: string } {
  const role = item.role ?? "unknown";
  const type = item.type;
  let content: string | undefined;
  if (item.content && Array.isArray(item.content)) {
    const textPart = item.content.find((c) => c.type === "output_text" || c.type === "input_text");
    content = textPart?.text;
    if (!content) {
      const audioPart = item.content.find((c) => c.type === "output_audio" || c.type === "input_audio");
      content = (audioPart as { transcript?: string | null })?.transcript ?? (audioPart ? "[audio]" : undefined);
    }
  }
  return { role, content, type };
}

export function useRealtimeVoice(autoStart: boolean) {
  const [state, setState] = useState<RealtimeVoiceState>(DEFAULT_STATE);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const hasTriggeredGreeting = useRef(false);

  const close = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }
    hasTriggeredGreeting.current = false;
    setState(DEFAULT_STATE);
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    setState((s) => ({ ...s, status: "connecting", error: null }));

    let token: string;
    try {
      const res = await fetch("/api/voice/ephemeral-token", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "Failed to get token");
      }
      const data = (await res.json()) as { value?: string };
      const value = data?.value;
      if (!value) throw new Error("No token in response");
      token = value;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get ephemeral token";
      setState((s) => ({ ...s, status: "error", error: msg }));
      return;
    }

    const agent = createSchedulingAgent();
    const session = new RealtimeSession(agent, { model: "gpt-realtime" });
    sessionRef.current = session;

    session.on("history_updated", (history) => {
      const formatted = history
        .filter((h) => (h as { role?: string }).role === "user" || (h as { role?: string }).role === "assistant")
        .map((h) => formatHistoryItem(h as { role?: string; type?: string; content?: Array<{ type: string; text?: string }> }));
      const lastIsUser = formatted.length > 0 && formatted[formatted.length - 1]?.role === "user";
      setState((s) => ({ ...s, history: formatted, userActive: lastIsUser }));
      if (lastIsUser) {
        setTimeout(() => setState((prev) => ({ ...prev, userActive: false })), 1500);
      }
    });

    session.on("error", (err: { error?: unknown }) => {
      const msg = err?.error instanceof Error
        ? err.error.message
        : String(err?.error ?? "Connection error");
      setState((s) => ({ ...s, status: "error", error: msg }));
    });

    try {
      await session.connect({ apiKey: token });
      setState((s) => ({ ...s, status: "connected", error: null }));
      // Trigger agent to speak first ONCE - use minimal trigger to avoid duplicate/echo
      if (!hasTriggeredGreeting.current) {
        hasTriggeredGreeting.current = true;
        session.sendMessage("Start."); // Minimal - agent greets per instructions
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect";
      setState((s) => ({ ...s, status: "error", error: msg }));
      sessionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      connect();
    }
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    };
  }, [autoStart, connect]);

  return {
    state,
    connect,
    close,
    isActive: state.status === "connecting" || state.status === "connected",
  };
}
