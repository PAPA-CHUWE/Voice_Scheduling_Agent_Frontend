"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Voice command -> route mapping
const VOICE_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  home: "/dashboard",
  sessions: "/sessions",
  events: "/events",
  webhook: "/webhook-tester",
  "webhook tester": "/webhook-tester",
};

export function useVoiceNavigation() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  const resolveRoute = useCallback(
    (text: string): string | null => {
      const normalized = text.toLowerCase().trim().replace(/^(go to|open|show|navigate to)\s+/i, "");
      return VOICE_ROUTES[normalized] ?? null;
    },
    []
  );

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setLastCommand(path);
    },
    [router]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !isSupported) return;
    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (!transcript) return;
      const path = resolveRoute(transcript);
      if (path) {
        navigate(path);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      console.warn("[voice-nav]", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isSupported, resolveRoute, navigate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { isListening, isSupported, lastCommand, toggleListening };
}
