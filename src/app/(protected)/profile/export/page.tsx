"use client";

import { getAnalyticsExportData } from "@/api/generated/analytics/analytics";
import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { getTodayInKst, getWeekDates } from "@/app/(protected)/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { Download, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LogStatus = "ACHIEVED" | "MISSED" | "NOT_RECORDED";

type CsvData = {
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

export default function ProfileExportPage() {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [splitByWeek, setSplitByWeek] = useState(false);
  const today = getTodayInKst();
  const thisWeek = getWeekDates(today);

  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe();
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 3,
    },
  });
  const {
    data: activeScoreboardResponse,
    isLoading: isScoreboardLoading,
    error: scoreboardError,
  } = useGetScoreboardsActive({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace = workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const activeScoreboard =
    activeScoreboardResponse?.status === 200
      ? activeScoreboardResponse.data
      : null;

  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const hasNoScoreboard = getApiErrorStatus(scoreboardError) === 404;

  const [exportFrom, setExportFrom] = useState(thisWeek[0] ?? today);
  const [exportTo, setExportTo] = useState(thisWeek[6] ?? today);

  const exportMeasureOptions = useMemo(
    () =>
      (activeScoreboard?.leadMeasures ?? [])
        .filter((measure) => measure.status === "ACTIVE")
        .map((measure) => ({
          id: toNumberId(measure.id),
          name: measure.name,
        }))
        .filter(
          (measure): measure is { id: number; name: string } =>
            measure.id !== null,
        ),
    [activeScoreboard],
  );

  const [selectedExportMeasureIds, setSelectedExportMeasureIds] = useState<number[]>(
    [],
  );

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

  const toggleExportMeasure = (measureId: number) => {
    setSelectedExportMeasureIds((previous) =>
      previous.includes(measureId)
        ? previous.filter((id) => id !== measureId)
        : [...previous, measureId],
    );
  };

  const toggleSelectAllMeasures = () => {
    setSelectedExportMeasureIds(
      isAllMeasuresSelected ? [] : exportMeasureOptions.map((measure) => measure.id),
    );
  };

  const handleExportCsv = async () => {
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

  if (isProfileLoading || isWorkspaceLoading || isScoreboardLoading) {
    return <ExportSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return <NoScoreboardState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-6 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
          <p className="text-xs text-text-muted">데이터 내보내기</p>
          <div className="w-8" />
        </header>

        <Card className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              {user?.nickname ?? "사용자"}님의 CSV 다운로드
            </h1>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {workspace?.name}
            </p>
          </div>
        </Card>

        <Card className="border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">내보내기 조건</h2>
            <p className="text-[11px] text-text-muted">
              기간(최대 92일)과 선행지표를 선택해 CSV 파일로 내려받습니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
              <span className="shrink-0 text-[11px]">시작일</span>
              <input
                type="date"
                value={exportFrom}
                onChange={(event) => setExportFrom(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
              />
            </label>
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
              <span className="shrink-0 text-[11px]">종료일</span>
              <input
                type="date"
                value={exportTo}
                onChange={(event) => setExportTo(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-text-muted">선행지표 선택</p>
              <Button
                type="button"
                onClick={toggleSelectAllMeasures}
                className="h-7 rounded-lg border border-border bg-white px-2.5 text-[11px] font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary"
              >
                {isAllMeasuresSelected ? "전체 해제" : "전체 선택"}
              </Button>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {exportMeasureOptions.map((measure) => {
                const checked = selectedExportMeasureIds.includes(measure.id);

                return (
                  <label
                    key={measure.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExportMeasure(measure.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="truncate">{measure.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-sub-background px-3 py-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={splitByWeek}
              onChange={(event) => setSplitByWeek(event.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span>주차별로 섹션 분리해서 내보내기</span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-text-muted">
              선택 지표 {selectedExportMeasureIds.length}개
            </p>
            <Button
              type="button"
              onClick={() => void handleExportCsv()}
              disabled={isExporting}
              className="h-9 w-full rounded-lg bg-primary px-4 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "CSV 생성 중..." : "CSV 다운로드"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ExportSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="h-[420px] rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
      <div className="max-w-[400px] w-full space-y-8 animate-linear-in">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            소속된 워크스페이스가 없어요
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            내보내기 전에 워크스페이스에 먼저 참여하거나 생성해주세요.
          </p>
        </div>

        <Button
          asChild
          className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
        >
          <Link href="/workspace/new">새 워크스페이스 만들기</Link>
        </Button>
      </div>
    </div>
  );
}

function NoScoreboardState() {
  return (
    <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
      <div className="max-w-[400px] w-full space-y-8 animate-linear-in">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            아직 점수판이 없어요
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            점수판을 만든 뒤 기간별 데이터를 CSV로 저장할 수 있어요.
          </p>
        </div>

        <Button
          asChild
          className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
        >
          <Link href="/setup?mode=create">새 점수판 만들기</Link>
        </Button>
      </div>
    </div>
  );
}

function getDayCountInclusive(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return null;
  }

  const dayMs = 86_400_000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / dayMs) + 1;
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

function buildExportCsv(data: CsvData, splitByWeek: boolean) {
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
    const targetValue = inferTargetValue(measure, fullDateCount, fullWeekCount, fullMonthCount);
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

function downloadCsv(csv: string, from: string, to: string) {
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
