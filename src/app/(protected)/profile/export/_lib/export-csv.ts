type LogStatus = "ACHIEVED" | "MISSED" | "NOT_RECORDED";

export type CsvData = {
  periodMeta?: { from?: string; to?: string; dayCount?: number };
  summary?: {
    achieved?: number;
    total?: number;
    achievementRate?: number;
    isWinning?: boolean;
  };
  leadMeasureBreakdown?: Array<{
    leadMeasureId: number;
    name: string;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    achieved: number;
    total: number;
    achievementRate: number;
  }>;
  dailyRows?: Array<{
    date: string;
    leadMeasureId: number;
    leadMeasureName: string;
    status: LogStatus;
  }>;
};

export function getDayCountInclusive(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return null;
  }

  const dayMs = 86_400_000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / dayMs) + 1;
}

export function buildExportCsv(data: CsvData, splitByWeek: boolean) {
  const periodMeta = data.periodMeta ?? {};
  const summary = data.summary ?? {};
  const leadMeasureBreakdown = data.leadMeasureBreakdown ?? [];
  const dailyRows = data.dailyRows ?? [];
  const rows: string[] = [];

  const dates = [...new Set(dailyRows.map((row) => row.date))].sort();
  const weekStarts = [...new Set(dates.map((date) => getWeekStart(date)))].sort();
  const monthStarts = [...new Set(dates.map((date) => date.slice(0, 7)))].sort();
  const statusByMeasureDate = new Map<string, LogStatus>(
    dailyRows.map((row) => [`${row.leadMeasureId}:${row.date}`, row.status]),
  );

  rows.push(`기간,${periodMeta.from ?? ""} ~ ${periodMeta.to ?? ""}`);
  rows.push(
    `전체 달성률,${summary.achieved ?? 0}/${summary.total ?? 0} (${summary.achievementRate ?? 0}%)`,
  );
  rows.push("");

  if (splitByWeek && weekStarts.length > 0) {
    weekStarts.forEach((weekStart, index) => {
      const sectionDates = dates.filter((date) => getWeekStart(date) === weekStart);
      if (sectionDates.length === 0) {
        return;
      }

      rows.push(
        `주차,${index + 1}주차 (${sectionDates[0]} ~ ${sectionDates[sectionDates.length - 1]})`,
      );
      appendDashboardLikeTable(
        rows,
        leadMeasureBreakdown,
        sectionDates,
        statusByMeasureDate,
        dates.length,
        weekStarts.length,
        monthStarts.length,
      );
      rows.push("");
    });

    return rows.join("\n");
  }

  appendDashboardLikeTable(
    rows,
    leadMeasureBreakdown,
    dates,
    statusByMeasureDate,
    dates.length,
    weekStarts.length,
    monthStarts.length,
  );

  return rows.join("\n");
}

export function downloadCsv(csv: string, from: string, to: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wig-my-export-${from.replaceAll("-", "")}-${to.replaceAll("-", "")}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseDate(date: string) {
  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function escapeCsvCell(value: string | number) {
  const raw = String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }

  return raw;
}

function appendDashboardLikeTable(
  rows: string[],
  measures: NonNullable<CsvData["leadMeasureBreakdown"]>,
  dates: string[],
  statusByMeasureDate: Map<string, LogStatus>,
  fullDateCount: number,
  fullWeekCount: number,
  fullMonthCount: number,
) {
  rows.push(
    [
      "선행지표",
      "기간",
      "목표",
      ...dates.map((date) => date.slice(5)),
      "달성",
      "달성률",
    ].join(","),
  );

  for (const measure of measures) {
    const targetValue = inferTargetValue(
      measure,
      fullDateCount,
      fullWeekCount,
      fullMonthCount,
    );
    const unit =
      measure.period === "DAILY" ? "일" : measure.period === "WEEKLY" ? "주" : "월";
    const marks = dates.map((date) => {
      const status = statusByMeasureDate.get(`${measure.leadMeasureId}:${date}`);
      if (status === "ACHIEVED") {
        return "O";
      }
      if (status === "MISSED") {
        return "X";
      }
      return "";
    });

    const achieved = calculateAchievedInRange(
      measure.leadMeasureId,
      measure.period,
      dates,
      targetValue,
      statusByMeasureDate,
    );
    const bucketCount =
      measure.period === "DAILY"
        ? dates.length
        : measure.period === "WEEKLY"
          ? new Set(dates.map((date) => getWeekStart(date))).size
          : new Set(dates.map((date) => date.slice(0, 7))).size;
    const total = bucketCount * targetValue;
    const rate = total > 0 ? Number(((achieved / total) * 100).toFixed(1)) : 0;

    rows.push(
      [
        escapeCsvCell(measure.name),
        getPeriodLabelKo(measure.period),
        `${targetValue}회/${unit}`,
        ...marks,
        `${achieved}/${total}`,
        `${rate}%`,
      ].join(","),
    );
  }
}

function inferTargetValue(
  measure: NonNullable<CsvData["leadMeasureBreakdown"]>[number],
  fullDateCount: number,
  fullWeekCount: number,
  fullMonthCount: number,
) {
  if (measure.period === "DAILY") {
    return fullDateCount > 0 ? Math.round(measure.total / fullDateCount) : 0;
  }
  if (measure.period === "WEEKLY") {
    return fullWeekCount > 0 ? Math.round(measure.total / fullWeekCount) : 0;
  }
  return fullMonthCount > 0 ? Math.round(measure.total / fullMonthCount) : 0;
}

function calculateAchievedInRange(
  leadMeasureId: number,
  period: "DAILY" | "WEEKLY" | "MONTHLY",
  dates: string[],
  targetValue: number,
  statusByMeasureDate: Map<string, LogStatus>,
) {
  if (targetValue <= 0 || dates.length === 0) {
    return 0;
  }

  if (period === "DAILY") {
    return dates.reduce((sum, date) => {
      const status = statusByMeasureDate.get(`${leadMeasureId}:${date}`);
      return status === "ACHIEVED" ? sum + 1 : sum;
    }, 0);
  }

  const bucketMap = new Map<string, number>();
  for (const date of dates) {
    const status = statusByMeasureDate.get(`${leadMeasureId}:${date}`);
    if (status !== "ACHIEVED") {
      continue;
    }

    const bucket = period === "WEEKLY" ? getWeekStart(date) : date.slice(0, 7);
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
  }

  let achieved = 0;
  for (const count of bucketMap.values()) {
    achieved += Math.min(count, targetValue);
  }

  return achieved;
}

function getWeekStart(dateString: string) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function getPeriodLabelKo(period: "DAILY" | "WEEKLY" | "MONTHLY") {
  if (period === "DAILY") {
    return "일간";
  }
  if (period === "WEEKLY") {
    return "주간";
  }
  return "월간";
}
