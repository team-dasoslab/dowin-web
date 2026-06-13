"use client";

import { useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
}

export default function AdminModal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = "max-w-4xl",
}: AdminModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Disable background scrolling when modal is active
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-none border-none rounded-[24px] w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-dowin-in space-y-6 select-text`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          {title ? (
            <h3 className="text-[18px] font-black tracking-tight text-text-primary">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <Button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-all p-2 rounded-full bg-transparent hover:bg-zinc-100 min-h-0"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
