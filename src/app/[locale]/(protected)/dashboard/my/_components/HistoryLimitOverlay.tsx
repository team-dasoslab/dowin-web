"use client";

import { Lock } from "lucide-react";
import React from "react";

interface HistoryLimitOverlayProps {
  children?: React.ReactNode;
  isLimited: boolean;
}

export function HistoryLimitOverlay({ children, isLimited }: HistoryLimitOverlayProps) {
  if (!isLimited) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-lg min-h-[160px]">
      <div className="pointer-events-none filter blur-[3px] opacity-30 select-none">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px] p-4 text-center animate-linear-in">
        <div className="rounded-full bg-sub-background p-2">
          <Lock className="h-4 w-4 text-text-muted" />
        </div>
        <p className="text-[11px] text-text-muted">
          6개월 이전 데이터는 비공개입니다.
        </p>
      </div>
    </div>
  );
}
