"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-300">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="absolute inset-0 w-10 h-10 border-4 border-primary/20 rounded-full" />
      </div>
      <p className="mt-4 text-sm font-medium text-text-secondary animate-pulse">
        데이터를 불러오는 중입니다.
      </p>
    </div>
  );
}
