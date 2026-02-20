"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);
  const value = useMemo(() => ({ toasts, addToast }), [toasts, addToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2 shadow-lg ${
              t.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : t.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-sky-200 bg-sky-50 text-sky-800"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toasts: [], addToast: (_m: string, _t?: "success" | "error" | "info") => {} };
  return ctx;
}
