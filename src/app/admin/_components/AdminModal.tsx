"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 select-text`}>
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
            variant="ghost"
            className="text-text-muted p-2 rounded-full min-h-0"
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
      </DialogContent>
    </Dialog>
  );
}
