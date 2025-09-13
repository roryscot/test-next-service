"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "warn" | "danger";
};

const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(
  null
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(s => [...s, { id, ...t }]);
    setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), 4000);
  }, []);
  const ctx = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`shadow-soft bg-card min-w-[260px] rounded-2xl px-4 py-3 ring-1 ring-white/10 ${
              t.variant === "success"
                ? "border-success border-l-4"
                : t.variant === "warn"
                  ? "border-warn border-l-4"
                  : t.variant === "danger"
                    ? "border-danger border-l-4"
                    : "border-primary border-l-4"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description && (
              <div className="text-muted mt-0.5 text-sm">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
