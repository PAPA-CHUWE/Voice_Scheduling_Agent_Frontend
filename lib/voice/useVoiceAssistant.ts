"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseNaturalDateTime } from "./parseDateTime";
import { apiWebhook, apiVoice } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatDate";

export type VoiceStep =
  | "idle"
  | "greeting"
  | "name"
  | "date"
  | "time"
  | "title"
  | "confirm"
  | "creating"
  | "success"
  | "error";

export interface VoiceState {
  step: VoiceStep;
  attendeeName: string;
  attendeeEmail: string;
  title: string;
  startIso: string;
  durationMinutes: number;
  timezone: string;
  transcript: string;
  assistantMessage: string;
  error: string | null;
}

const DEFAULT_STATE: VoiceState = {
  step: "idle",
  attendeeName: "",
  attendeeEmail: "",
  title: "Meeting",
  startIso: "",
  durationMinutes: 30,
  timezone: "Africa/Harare",
  transcript: "",
  assistantMessage: "",
  error: null,
};

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

export function useVoiceAssistant() {
  const [state, setState] = useState<VoiceState>(DEFAULT_STATE);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1;
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }, []);

  const say = useCallback(
    (msg: string, updateState = true) => {
      if (updateState) {
        setState((s) => ({ ...s, assistantMessage: msg, error: null }));
      }
      speak(msg);
    },
    [speak]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rc = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(!!rc && !!window.speechSynthesis);
  }, []);

  const startConversation = useCallback(() => {
    setState({ ...DEFAULT_STATE, step: "greeting", assistantMessage: "" });
    const msg =
      "Hi! I'm your voice scheduling assistant. What's your name?";
    say(msg, false);
    setState((s) => ({ ...s, step: "greeting", assistantMessage: msg }));
  }, [say]);

  const processTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript || transcript.length < 2) return;
      const t = transcript.trim().toLowerCase();

      // Cancel / stop - restart conversation
      if (t.includes("cancel") || t.includes("stop") || t.includes("nevermind")) {
        setState((s) => ({
          ...DEFAULT_STATE,
          step: "name",
          transcript: "",
          assistantMessage: "",
        }));
        say("Let's start over. What's your name?");
        return;
      }

      setState((s) => ({ ...s, transcript }));

      // Try OpenAI parse (when OPENAI_API_KEY is set)
      let openai: { name?: string; startIso?: string; title?: string } | null = null;
      try {
        const res = await apiVoice.parse({
          transcript,
          step: state.step,
          context: { attendeeName: state.attendeeName, startIso: state.startIso },
        });
        if (!res.useFallback) openai = res;
      } catch {
        // fallback to local parsing
      }

      switch (state.step) {
        case "greeting":
        case "name": {
          const name = openai?.name ?? transcript.replace(/^(my name is|i'm|i am|it's|it is)\s+/i, "").trim();
          if (name && name.length >= 2) {
            setState((s) => ({
              ...s,
              step: "date",
              attendeeName: name,
              transcript: "",
              assistantMessage: "",
            }));
            say(`Nice to meet you, ${name}. What date would you like for the meeting? For example, tomorrow or February 21.`);
          } else {
            say("I didn't catch that. Please say your name again.");
          }
          break;
        }

        case "date": {
          const parsed = openai?.startIso
            ? { startIso: openai.startIso, timezone: "Africa/Harare" }
            : parseNaturalDateTime(transcript);
          if (parsed && parsed.startIso) {
            const hasTime = /at\s+\d|^\d{1,2}(:\d{2})?\s*(am|pm)|(am|pm)\b/i.test(transcript);
            const nextStep = hasTime ? "title" : "time";
            const nextPrompt = hasTime
              ? "What would you like to call this meeting?"
              : "Got it. What time? For example, 3pm or 10:30am.";
            setState((s) => ({
              ...s,
              step: nextStep,
              startIso: parsed.startIso,
              timezone: parsed.timezone,
              transcript: "",
              assistantMessage: "",
            }));
            say(nextPrompt);
          } else {
            say("I didn't understand that date. Try saying tomorrow, or a specific date like February 21.");
          }
          break;
        }

        case "time": {
          const prevIso = state.startIso || new Date(Date.now() + 86400000).toISOString();
          const baseDate = new Date(prevIso);
          const parsed = openai?.startIso
            ? { startIso: openai.startIso, timezone: "Africa/Harare" }
            : parseNaturalDateTime(transcript, baseDate);
          if (parsed && parsed.startIso) {
            setState((s) => ({
              ...s,
              step: "title",
              startIso: parsed.startIso,
              timezone: parsed.timezone,
              transcript: "",
              assistantMessage: "",
            }));
            say("What would you like to call this meeting?");
          } else {
            const timeOnly = parseNaturalDateTime(`today at ${transcript}`);
            if (timeOnly) {
              const d = new Date(prevIso);
              const t = new Date(timeOnly.startIso);
              d.setHours(t.getHours(), t.getMinutes(), 0, 0);
              const startIso = d.toISOString();
              setState((s) => ({
                ...s,
                step: "title",
                startIso,
                transcript: "",
                assistantMessage: "",
              }));
              say("What would you like to call this meeting?");
            } else {
              say("I didn't understand the time. Try saying 3pm or 10:30am.");
            }
          }
          break;
        }

        case "title": {
          const newTitle = (openai?.title ?? transcript.replace(/^(call it|title is|it's|it is)\s+/i, "").trim()) || "Meeting";
          const finalTitle = newTitle.length >= 1 ? newTitle : "Meeting";
          const summary = `Okay, ${state.attendeeName}. Your meeting "${finalTitle}" is scheduled for ${formatDateTime(state.startIso || "")}. Say yes to confirm, or cancel to start over.`;
          setState((s) => ({
            ...s,
            step: "confirm",
            title: finalTitle,
            transcript: "",
            assistantMessage: summary,
          }));
          say(summary, false);
          break;
        }

        case "confirm": {
          if (t.includes("yes") || t.includes("confirm") || t.includes("correct") || t.includes("sounds good")) {
            if (!state.attendeeName?.trim() || !state.startIso || !state.title?.trim()) {
              say("Missing details. Let's start over. What's your name?");
              setState((s) => ({ ...s, step: "name", transcript: "" }));
              break;
            }
            setState((s) => ({ ...s, step: "creating", transcript: "", assistantMessage: "Creating your calendar event...", error: null }));
            say("Creating your calendar event.", false);

            const payload = {
              type: "tool_call",
              toolName: "create_calendar_event",
              arguments: {
                attendee_name: state.attendeeName,
                title: state.title,
                start_iso: state.startIso,
                duration_minutes: state.durationMinutes,
                timezone: state.timezone,
                reminders_enabled: true,
                reminder_offsets_minutes: [60, 10],
              },
            };

            apiWebhook
              .voice(payload as Record<string, unknown>)
              .then((res) => {
                const data = res as { data?: { title?: string; htmlLink?: string } };
                const msg = `Done! Your meeting "${data?.data?.title ?? state.title}" has been created. Check your calendar.`;
                setState((s) => ({
                  ...s,
                  step: "success",
                  assistantMessage: msg,
                  error: null,
                }));
                say(msg, false);
              })
              .catch((err) => {
                const msg = err instanceof Error ? err.message : "Failed to create event.";
                setState((s) => ({
                  ...s,
                  step: "error",
                  error: msg,
                  assistantMessage: msg,
                }));
                say(`Sorry, ${msg}. Please try again or create an event manually.`, false);
              });
          } else if (t.includes("no") || t.includes("cancel") || t.includes("change")) {
            setState((s) => ({ ...s, step: "name", transcript: "", assistantMessage: "" }));
            say("No problem. Let's start over. What's your name?");
          } else {
            say("Say yes to confirm, or no to start over.");
          }
          break;
        }

        default:
          break;
      }
    },
    [state, say]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !isSupported) return;
    const SpeechRecognitionClass = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ")
          .trim();
        if (transcript) processTranscript(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "no-speech") return;
        if (event.error === "aborted") return;
        setState((s) => ({ ...s, error: `Speech error: ${event.error}` }));
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : "Failed to start microphone",
      }));
    }
  }, [isSupported, processTranscript]);

  const stopListening = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setState(DEFAULT_STATE);
  }, [stopListening]);

  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) recognitionRef.current.abort();
        window.speechSynthesis?.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  return {
    state,
    isListening,
    isSupported,
    startConversation,
    startListening,
    stopListening,
    reset,
  };
}
