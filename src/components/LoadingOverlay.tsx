"use client";

import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  message?: string;
};

export function LoadingOverlay({
  message = "처리 중입니다.",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-primary/20" />
      </div>
      <p className="mt-4 text-sm font-medium text-text-secondary animate-pulse">
        {message}
      </p>
    </div>
  );
}
