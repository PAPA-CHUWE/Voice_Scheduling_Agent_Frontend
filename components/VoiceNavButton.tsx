"use client";

import { Mic, MicOff } from "lucide-react";
import { useVoiceNavigation } from "@/lib/voice/useVoiceNavigation";

export function VoiceNavButton() {
  const { isListening, isSupported, toggleListening } = useVoiceNavigation();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
        isListening
          ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 dark:text-red-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-label={isListening ? "Stop voice navigation" : "Start voice navigation"}
      title={isListening ? "Listening... Say 'dashboard', 'sessions', 'events'" : "Voice navigation"}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="hidden sm:inline">Listening</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Voice</span>
        </>
      )}
    </button>
  );
}
