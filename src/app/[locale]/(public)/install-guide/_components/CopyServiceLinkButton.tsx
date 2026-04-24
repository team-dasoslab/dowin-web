"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { DowinIcon } from "@/components/ui/DowinIcon";
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
        <DowinIcon name="status-checkmark" size="14px" className="text-primary" />
      ) : (
        <DowinIcon name="action-copy" size="14px" className="text-text-muted" />
      )}
      {isCopied ? t("Common.copyDone") : tPage("copyLinkButton")}
    </Button>
  );
}
