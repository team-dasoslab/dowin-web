"use client";

import { getAnalyticsExportData } from "@/api/generated/analytics/analytics";
import {
  buildExportCsv,
  downloadCsv,
  getDayCountInclusive,
} from "@/app/(protected)/profile/export/_lib/export-csv";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useState } from "react";

type UseProfileExportActionParams = {
  exportFrom: string;
  exportTo: string;
  selectedExportMeasureIds: number[];
  splitByWeek: boolean;
};

export const useProfileExportAction = ({
  exportFrom,
  exportTo,
  selectedExportMeasureIds,
  splitByWeek,
}: UseProfileExportActionParams) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    const dayCount = getDayCountInclusive(exportFrom, exportTo);
    if (dayCount === null) {
      showToast("error", "기간 날짜 형식을 확인해주세요.");
      return;
    }
    if (dayCount <= 0) {
      showToast("info", "종료일은 시작일 이후여야 합니다.");
      return;
    }
    if (dayCount > 92) {
      showToast("info", "조회 기간은 최대 92일까지 가능합니다.");
      return;
    }
    if (selectedExportMeasureIds.length === 0) {
      showToast("info", "최소 1개 이상의 선행지표를 선택해주세요.");
      return;
    }

    setIsExporting(true);

    try {
      const response = await getAnalyticsExportData({
        from: exportFrom,
        to: exportTo,
        leadMeasureIds: selectedExportMeasureIds,
      });
      if (response.status !== 200) {
        showToast("error", "내보내기 데이터를 불러오지 못했습니다.");
        return;
      }

      const csv = buildExportCsv(response.data, splitByWeek);
      downloadCsv(csv, exportFrom, exportTo);
      showToast("success", "CSV 다운로드를 시작했습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "내보내기 데이터를 불러오지 못했습니다."),
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportCsv,
    isExporting,
  };
};
