"use client";

import { getWorkspacesWorkspaceIdAnalyticsExportData } from "@/api/generated/analytics/analytics";
import {
  buildExportCsv,
  downloadCsv,
  getDayCountInclusive,
} from "@/app/[locale]/(protected)/profile/export/_lib/export-csv";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorCode,
  getApiErrorMessage,
} from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseProfileExportActionParams = {
  workspaceId?: string;
  exportFrom: string;
  exportTo: string;
  selectedExportMeasureIds: number[];
  splitByWeek: boolean;
};

export const useProfileExportAction = ({
  workspaceId,
  exportFrom,
  exportTo,
  selectedExportMeasureIds,
  splitByWeek,
}: UseProfileExportActionParams) => {
  const t = useTranslations("Profile.Export");
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    const dayCount = getDayCountInclusive(exportFrom, exportTo);
    if (dayCount === null) {
      showToast("error", t("invalidDate"));
      return;
    }
    if (dayCount <= 0) {
      showToast("info", t("invalidRange"));
      return;
    }
    if (dayCount > 92) {
      showToast("info", t("rangeLimit"));
      return;
    }
    if (selectedExportMeasureIds.length === 0) {
      showToast("info", t("emptyMeasures"));
      return;
    }

    if (!workspaceId) {
      showToast("error", t("failed"));
      return;
    }

    setIsExporting(true);

    try {
      const response = await getWorkspacesWorkspaceIdAnalyticsExportData(workspaceId, {
        from: exportFrom,
        to: exportTo,
        leadMeasureIds: selectedExportMeasureIds,
      });
      if (response.status !== 200) {
        showToast("error", t("fetchFailed"));
        return;
      }

      const csv = buildExportCsv(response.data, splitByWeek);
      downloadCsv(csv, exportFrom, exportTo);
      showToast("success", t("downloadStarted"));
    } catch (error) {
      if (getApiErrorCode(error) === "STANDARD_PLAN_REQUIRED") {
        showToast("info", t("standardRequired"));
        return;
      }

      showToast("error", getApiErrorMessage(error, t("fetchFailed")));
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportCsv,
    isExporting,
  };
};
