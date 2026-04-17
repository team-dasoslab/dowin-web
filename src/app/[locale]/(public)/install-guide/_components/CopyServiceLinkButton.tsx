"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function CopyServiceLinkButton() {
  const t = useTranslations();
  const tPage = useTranslations("InstallGuidePage");
  const { showToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const targetUrl =
      typeof window === "undefined" ? "" : `${window.location.origin}/`;

    try {
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      showToast("success", tPage("copyLinkSuccess"));

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      showToast("error", tPage("copyLinkError"));
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
      {isCopied ? t("Common.copyDone") : tPage("copyLinkButton")}
    </Button>
  );
}
