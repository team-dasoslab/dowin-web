import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const useCopyServiceLink = () => {
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

  return { isCopied, handleCopy };
};
