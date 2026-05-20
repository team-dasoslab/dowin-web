"use client";

import { DowinIcon } from "@/components/ui/DowinIcon";
import { usePathname } from "@/i18n/routing";
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
  const pathname = usePathname();

  // Main tab paths where the bottom navigation is visible
  const mainTabPaths = [
    "/",
    "/dashboard",
    "/dashboard/my",
    "/report",
    "/setup",
    "/scoreboards",
    "/profile",
  ];

  const isMainTab = mainTabPaths.includes(pathname);

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
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none transition-[bottom] duration-200 ease-out`}
        style={{
          bottom: isMainTab
            ? "calc(6.75rem + var(--safe-area-inset-bottom, 0px))"
            : "calc(1.5rem + var(--safe-area-inset-bottom, 0px))",
        }}
      >
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
                    ? "bg-success"
                    : toast.type === "error"
                      ? "bg-danger"
                      : "bg-zinc-600"
                }
              `}
            />

            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg transition-colors flex-shrink-0"
            >
              <DowinIcon name="action-dismiss" size="16px" />
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
