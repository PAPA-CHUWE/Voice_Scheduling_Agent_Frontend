"use client";

import { Mic } from "lucide-react";
import { useVoice } from "@/lib/voice/VoiceProvider";

export function VoiceAssistant() {
  const voice = useVoice();

  if (!voice?.isSupported) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Voice assistant requires a supported browser (Chrome or Edge recommended). Please enable microphone access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm font-medium">Voice Scheduling Assistant</span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Click to open the voice assistant. You&apos;ll speak with an AI that asks for your name, preferred
          date/time, and meeting title, then creates a calendar event.
        </p>
        <button
          type="button"
          onClick={voice.openAssistant}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Mic className="h-5 w-5" />
          Start voice assistant
        </button>
      </div>
    </div>
  );
}
