"use client";

import { useCopyServiceLink } from "@/app/[locale]/(public)/install-guide/_hooks/useCopyServiceLink";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

export function CopyServiceLinkButton() {
  const t = useTranslations();
  const tPage = useTranslations("InstallGuidePage");
  const { isCopied, handleCopy } = useCopyServiceLink();

  return (
    <Button
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-sub-background px-3 py-2 text-[12px] font-semibold text-text-primary transition-colors"
      onClick={() => {
        void handleCopy();
      }}
      type="button"
    >
      {isCopied ? (
        <DowinIcon
          name="status-checkmark"
          size="14px"
          className="text-primary"
        />
      ) : (
        <DowinIcon name="action-copy" size="14px" className="text-text-muted" />
      )}
      {isCopied ? t("Common.copyDone") : tPage("copyLinkButton")}
    </Button>
  );
}
