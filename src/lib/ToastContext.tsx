"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <FiCheckCircle size={16} className="shrink-0 text-positive" />,
    error: <FiAlertCircle size={16} className="shrink-0 text-negative" />,
    info: <FiInfo size={16} className="shrink-0 text-accent-3" />,
  };

  const borderColors = {
    success: "border-positive/30",
    error: "border-negative/30",
    info: "border-accent-3/30",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-slide-up flex items-center gap-2.5 rounded-xl border ${borderColors[t.type]} bg-card-bg px-4 py-3 shadow-2xl backdrop-blur-xl`}
          >
            {icons[t.type]}
            <p className="text-sm font-medium text-heading">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-1 rounded-lg p-0.5 text-muted transition-colors hover:text-heading"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
