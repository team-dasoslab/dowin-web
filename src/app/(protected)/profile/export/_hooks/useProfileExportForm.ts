"use client";

import { getTodayInKst, getWeekDates } from "@/app/(protected)/dashboard/my/_lib/week";
import { useEffect, useState } from "react";

type ExportMeasureOption = {
  id: number;
  name: string;
};

type UseProfileExportFormParams = {
  exportMeasureOptions: ExportMeasureOption[];
};

export const useProfileExportForm = ({
  exportMeasureOptions,
}: UseProfileExportFormParams) => {
  const today = getTodayInKst();
  const thisWeek = getWeekDates(today);

  const [exportFrom, setExportFrom] = useState(thisWeek[0] ?? today);
  const [exportTo, setExportTo] = useState(thisWeek[6] ?? today);
  const [splitByWeek, setSplitByWeek] = useState(false);
  const [selectedExportMeasureIds, setSelectedExportMeasureIds] = useState<
    number[]
  >([]);

  useEffect(() => {
    const nextIds = exportMeasureOptions.map((measure) => measure.id);
    setSelectedExportMeasureIds((previous) => {
      if (
        previous.length === nextIds.length &&
        previous.every((id, index) => id === nextIds[index])
      ) {
        return previous;
      }

      return nextIds;
    });
  }, [exportMeasureOptions]);

  const isAllMeasuresSelected =
    exportMeasureOptions.length > 0 &&
    selectedExportMeasureIds.length === exportMeasureOptions.length;

  const handleExportFromChange = (value: string) => {
    setExportFrom(value);
  };

  const handleExportToChange = (value: string) => {
    setExportTo(value);
  };

  const toggleSplitByWeek = (checked: boolean) => {
    setSplitByWeek(checked);
  };

  const toggleExportMeasure = (measureId: number) => {
    setSelectedExportMeasureIds((previous) =>
      previous.includes(measureId)
        ? previous.filter((id) => id !== measureId)
        : [...previous, measureId],
    );
  };

  const toggleSelectAllMeasures = () => {
    setSelectedExportMeasureIds(
      isAllMeasuresSelected
        ? []
        : exportMeasureOptions.map((measure) => measure.id),
    );
  };

  return {
    exportFrom,
    exportTo,
    handleExportFromChange,
    handleExportToChange,
    isAllMeasuresSelected,
    selectedExportMeasureIds,
    splitByWeek,
    toggleExportMeasure,
    toggleSelectAllMeasures,
    toggleSplitByWeek,
  };
};
