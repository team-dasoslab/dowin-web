"use client";

import { useRef, useState } from "react";
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
  const { showToast } = useToast();
  const t = useTranslations("Dashboard");

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
      });

      const filename = getSafeImageFilename({
        nickname: member.nickname,
        weekStart,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("success", t("scoreboardImageSaved"));
      onSuccess?.();
    } catch (err) {
      console.error("Failed to export scoreboard image:", err);
      showToast("error", t("scoreboardImageSaveFailed"));
      onError?.();
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportRef,
    isExporting,
    saveImage,
  };
}
