"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyServiceLinkButton() {
  const { showToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const targetUrl =
      typeof window === "undefined" ? "" : `${window.location.origin}/`;

    try {
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      showToast("success", "서비스 링크를 복사했어요.");

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      showToast("error", "링크 복사에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <Button
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-sub-background px-3 py-2 text-[12px] font-semibold text-text-primary transition-colors hover:bg-white"
      onClick={() => {
        void handleCopy();
      }}
      type="button"
    >
      {isCopied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-text-muted" />
      )}
      {isCopied ? "복사 완료" : "서비스 링크 복사하기"}
    </Button>
  );
}
