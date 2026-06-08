"use client";

import { useEffect, useRef, useState } from "react";
import { TeamDashboardMember } from "@/api/generated/dowin.schemas";
import { getSafeImageFilename } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/scoreboard-image";
import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";

type UseScoreboardImageExportInput = {
  member: TeamDashboardMember | null;
  weekStart: string | null;
  onSuccess?: () => void;
  onError?: () => void;
};

export function useScoreboardImageExport({
  member,
  weekStart,
  onSuccess,
  onError,
}: UseScoreboardImageExportInput) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const { showToast } = useToast();
  const t = useTranslations("Dashboard");

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    setIsShareSupported(typeof navigator !== "undefined" && !!navigator.share && isTouchDevice);
  }, []);

  const saveImage = async () => {
    if (!member || !exportRef.current || isExporting) return;

    try {
      setIsExporting(true);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f4f4f5",
        width: 1080,
      });

      const filename = getSafeImageFilename({
        nickname: member.nickname,
        weekStart,
      });

      // iOS/Mobile: Try Web Share API first so it can be saved to Photos or shared
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: "image/png" });

        if (isShareSupported && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
          });
          showToast("success", t("scoreboardImageSaved"));
          onSuccess?.();
          return;
        }
      } catch (shareErr) {
        if (shareErr instanceof Error && shareErr.name === "AbortError") {
          // User cancelled the share sheet, no need to fallback
          return;
        }
      }

      // Desktop / Unsupported browsers: Fallback to traditional anchor download
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("success", t("scoreboardImageSaved"));
      onSuccess?.();
    } catch (err) {
      showToast("error", t("scoreboardImageSaveFailed"));
      onError?.();
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportRef,
    isExporting,
    isShareSupported,
    saveImage,
  };
}
