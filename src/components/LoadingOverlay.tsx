"use client";

import {
  SignatureLoader,
  type SignatureLoaderVariant,
} from "@/components/SignatureLoader";

type LoadingOverlayProps = {
  message?: string;
  variant?: SignatureLoaderVariant;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingOverlay({
  message = "처리 중입니다.",
  variant = "ios",
  fullScreen = true,
  className = "",
}: LoadingOverlayProps) {
  return (
    <div
      className={`${fullScreen ? "fixed" : "absolute"} inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/28 backdrop-blur-[1px] animate-in fade-in duration-300 ${className}`.trim()}
    >
      <div className="flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-white/18 bg-[rgba(15,23,42,0.24)] px-6 py-5 text-center shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-white/16 text-white/88">
          <SignatureLoader size="lg" variant={variant} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/88">{message}</p>
        </div>
      </div>
    </div>
  );
}
