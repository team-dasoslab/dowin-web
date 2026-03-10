"use client";

import { X } from "lucide-react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300); // match animation duration
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      setToasts((prev) => {
        // Prevent duplicates
        if (prev.some((t) => t.message === message && !t.isExiting)) {
          return prev;
        }

        const id = Math.random().toString(36).substring(2, 9);
        const newToasts = [...prev, { id, message, type }];

        setTimeout(() => {
          removeToast(id);
        }, 3000);

        return newToasts;
      });
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              relative overflow-hidden
              flex items-center justify-between gap-3 pl-5 pr-4 py-3 rounded-xl shadow-2xl
              backdrop-blur-md bg-zinc-900/90 text-white
              ${toast.isExiting ? "animate-toast-out" : "animate-toast-in"}
            `}
          >
            {/* Left Indicator Line */}
            <div
              className={`
                absolute left-0 top-0 bottom-0 w-1.5
                ${
                  toast.type === "success"
                    ? "bg-emerald-500"
                    : toast.type === "error"
                      ? "bg-red-500"
                      : "bg-zinc-500"
                }
              `}
            />

            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
