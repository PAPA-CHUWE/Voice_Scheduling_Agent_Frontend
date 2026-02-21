"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRealtimeVoice, type RealtimeVoiceState } from "./useRealtimeVoice";
import { Mic } from "lucide-react";

const NO_VOICE_PATHS = ["/", "/login"];

type VoiceContextValue = {
  isActive: boolean;
  isSupported: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  reset: () => void;
  state: RealtimeVoiceState;
  connect: () => Promise<void>;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  return ctx;
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showVoice = pathname != null && !NO_VOICE_PATHS.includes(pathname);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    const handler = (e: CustomEvent<{ path: string }>) => {
      const path = e.detail?.path;
      if (path) router.push(path);
    };
    window.addEventListener("vsa-navigate", handler as EventListener);
    return () => window.removeEventListener("vsa-navigate", handler as EventListener);
  }, [router]);

  const { state, connect, close } = useRealtimeVoice(showVoice && overlayOpen);

  // Auto-start when user lands on protected pages
  useEffect(() => {
    if (showVoice && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      setOverlayOpen(true);
    }
  }, [showVoice]);

  const openAssistant = useCallback(() => {
    setOverlayOpen(true);
    connect();
  }, [connect]);

  const closeAssistant = useCallback(() => {
    close();
    setOverlayOpen(false);
  }, [close]);

  // Realtime API (WebRTC) is supported in modern browsers (Chrome, Edge, Safari, Firefox)
  const isSupported = typeof window !== "undefined" && typeof fetch !== "undefined";

  const ctxValue: VoiceContextValue = {
    isActive: overlayOpen && (state.status === "connecting" || state.status === "connected"),
    isSupported,
    openAssistant,
    closeAssistant,
    reset: closeAssistant,
    state,
    connect,
  };

  return (
    <VoiceContext.Provider value={ctxValue}>
      {children}
      {showVoice && (
        <VoiceMicButton
          state={state}
          overlayOpen={overlayOpen}
          onToggle={() => (overlayOpen ? closeAssistant() : openAssistant())}
          isActive={state.status === "connecting" || state.status === "connected"}
        />
      )}
      {showVoice && overlayOpen && (
        <VoiceOverlay
          state={state}
          onClose={closeAssistant}
        />
      )}
    </VoiceContext.Provider>
  );
}

function VoiceMicButton({
  state,
  overlayOpen,
  onToggle,
  isActive,
}: {
  state: RealtimeVoiceState;
  overlayOpen: boolean;
  onToggle: () => void;
  isActive: boolean;
}) {
  const userActive = state.userActive ?? false;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
        userActive
          ? "bg-emerald-500 text-white ring-4 ring-emerald-300/50"
          : isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
      aria-label={overlayOpen ? "Close voice assistant" : "Open voice assistant"}
      title={overlayOpen ? "Close" : "Voice assistant"}
    >
      <Mic className="h-6 w-6" />
    </button>
  );
}

function VoiceOverlay({
  state,
  onClose,
}: {
  state: RealtimeVoiceState;
  onClose: () => void;
}) {
  const inProgress = state.status === "connecting" || state.status === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Voice Scheduling Assistant</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
          {state.status === "connecting" && (
            <p className="text-sm text-muted-foreground">Connecting to voice assistant…</p>
          )}
          {state.status === "connected" && (
            <p className="text-sm text-muted-foreground">Connected. Speak naturally to schedule a meeting.</p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.history.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.history.slice(-8).map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="text-xs font-medium text-muted-foreground">{item.role}: </span>
                  <span className={item.role === "user" ? "italic" : ""}>
                    {item.content ?? "[audio]"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {inProgress && (
          <p className="mt-4 text-xs text-muted-foreground">
            Say &quot;cancel&quot; or &quot;start over&quot; to begin again
          </p>
        )}

        {(state.status === "error" || state.status === "connected") && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
