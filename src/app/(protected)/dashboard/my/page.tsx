"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toNumberId } from "@/lib/client/frontend-api";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Settings,
  Target,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { DAY_LABELS } from "@/app/(protected)/dashboard/my/_lib/week";

type StoredUser = {
  nickname?: string;
};

const getStoredNickname = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("wig_user");

  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as StoredUser;
    return user.nickname ?? null;
  } catch {
    return null;
  }
};

export default function MyDashboardPage() {
  const {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isWeeklyLogsLoading,
    overallRate,
    pendingLogKey,
    today,
    toggleLog,
    weekDates,
    weekLabel,
    weeklyById,
    workspace,
  } = useDashboardScoreboard();
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    setNickname(getStoredNickname());
  }, []);

  if (isLoading || (activeScoreboard && isWeeklyLogsLoading && weeklyById.size === 0)) {
    return <LoadingSpinner />;
  }

  if (hasNoWorkspace) {
    return (
      <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
        <div className="max-w-[400px] w-full space-y-8 animate-linear-in">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="text-primary w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              소속된 워크스페이스가 없어요
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              팀원들과 함께 목표를 공유하고 성장하기 위해
              <br />
              새로운 워크스페이스를 만들거나 초대받으세요.
            </p>
          </div>

          <Button
            asChild
            className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
          >
            <Link href="/workspace/new">
              <Plus className="w-4 h-4" />새 워크스페이스 만들기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return (
      <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
        <div className="max-w-[400px] w-full space-y-8 animate-linear-in">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="text-primary w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              아직 목표가 없어요
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              가장 중요한 단 하나의 목표, 가중목을 설정하고
              <br />
              매일의 성장을 기록하기 시작하세요.
            </p>
          </div>

          <Button
            asChild
            className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
          >
            <Link href="/setup?mode=create">
              <Plus className="w-4 h-4" />새 점수판 만들기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0"
            >
              <Link href="/dashboard">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted truncate">
                {workspace?.name}
              </p>
              <h1 className="text-sm font-bold text-text-primary truncate">
                {nickname ? `${nickname}님의 점수판` : "나의 점수판"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <Link href="/setup?mode=update">
                <Settings className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>점수판 관리</span>
              </Link>
            </Button>
            <Button
              asChild
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <Link href="/profile">
                <UserIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>내 프로필</span>
              </Link>
            </Button>
          </div>
        </header>

        <Card className="border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 flex items-start gap-4 border-b border-border">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                가중목
              </p>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                {activeScoreboard.goalName}
              </h2>
            </div>

            <div className="flex-shrink-0 text-right space-y-1">
              <p className="text-[10px] text-text-muted">이번 주 달성률</p>
              <p
                className={`text-2xl font-bold font-mono tracking-tight ${
                  overallRate >= 80
                    ? "text-green-600"
                    : overallRate >= 50
                      ? "text-amber-600"
                      : "text-text-primary"
                }`}
              >
                {overallRate}%
              </p>
            </div>
          </div>

          <div className="px-6 py-3 bg-sub-background flex items-center gap-3">
            <Target className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mr-3">
                후행지표
              </span>
              <span className="text-sm text-text-primary font-medium">
                {activeScoreboard.lagMeasure}
              </span>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-text-primary">
              주간 선행지표
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
                {weekLabel}
              </span>
              <Button
                asChild
                className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-[11px] font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary transition-colors flex items-center gap-1"
              >
                <Link href="/setup?mode=addMeasure">
                  <Plus className="w-3 h-3" />
                  지표 추가
                </Link>
              </Button>
            </div>
          </div>

          {activeLeadMeasures.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              활성화된 선행지표가 없습니다.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="bg-sub-background border-b border-border">
                    <table className="w-full table-fixed text-xs">
                      <colgroup>
                        <col className="w-[38%]" />
                        {DAY_LABELS.map((day) => (
                          <col key={day} className="w-[8%]" />
                        ))}
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="py-3 px-5 text-left text-[11px] font-bold text-text-muted uppercase tracking-widest">
                            선행지표
                          </th>
                          {DAY_LABELS.map((day, index) => (
                            <th
                              key={day}
                              className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                                weekDates[index] === today
                                  ? "text-primary"
                                  : "text-text-muted"
                              }`}
                            >
                              {day}
                            </th>
                          ))}
                          <th className="py-3 px-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest">
                            달성
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  <table className="w-full table-fixed text-xs">
                    <colgroup>
                      <col className="w-[38%]" />
                      {DAY_LABELS.map((day) => (
                        <col key={day} className="w-[8%]" />
                      ))}
                      <col className="w-[14%]" />
                    </colgroup>
                    <tbody className="divide-y divide-border">
                      {activeLeadMeasures.map((leadMeasure) => {
                        const leadMeasureId = toNumberId(leadMeasure.id);
                        const weekly = weeklyById.get(leadMeasureId);
                        const achievedCount = weekly?.achieved ?? 0;
                        const targetValue = leadMeasure.targetValue ?? 0;
                        const rate =
                          targetValue > 0
                            ? Math.round((achievedCount / targetValue) * 100)
                            : 0;

                        return (
                          <tr key={leadMeasure.id} className="bg-white">
                            <td className="py-4 px-5">
                              <Link
                                href={`/measure/${leadMeasure.id}`}
                                className="block font-semibold text-text-primary hover:text-primary transition-colors truncate text-sm"
                              >
                                {leadMeasure.name}
                              </Link>
                              <span className="text-[10px] text-text-muted">
                                목표 {targetValue}회 /{" "}
                                {leadMeasure.period === "DAILY"
                                  ? "일"
                                  : leadMeasure.period === "WEEKLY"
                                    ? "주"
                                    : "월"}
                              </span>
                            </td>

                            {weekDates.map((date) => {
                              const currentValue =
                                weekly?.logs?.[date] === undefined
                                  ? null
                                  : weekly.logs[date];
                              const isFuture = date > today;
                              const isToday = date === today;
                              const currentLogKey =
                                leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
                              const isPending = pendingLogKey === currentLogKey;

                              return (
                                <td key={date} className="py-3 text-center">
                                  <Button
                                    disabled={
                                      isFuture ||
                                      isPending ||
                                      isLogPending ||
                                      leadMeasureId === null
                                    }
                                    onClick={() => {
                                      if (leadMeasureId !== null) {
                                        void toggleLog(leadMeasureId, date);
                                      }
                                    }}
                                    className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center border transition-colors ${
                                      currentValue === true
                                        ? "bg-primary border-primary text-white"
                                        : currentValue === false
                                          ? "bg-rose-50 border-rose-200 text-rose-500"
                                          : isFuture
                                            ? "bg-sub-background border-dashed border-border text-text-muted/30"
                                            : isToday
                                              ? "bg-primary/5 border-primary/30 text-primary"
                                              : "bg-sub-background border-border text-text-muted"
                                    } ${isFuture || isPending || isLogPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                  >
                                    {currentValue === true ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : currentValue === false ? (
                                      <X className="w-3.5 h-3.5" />
                                    ) : (
                                      <Minus className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </td>
                              );
                            })}

                            <td className="py-4 px-3 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-10 h-1 bg-sub-background rounded-full overflow-hidden border border-border">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      rate >= 100
                                        ? "bg-green-500"
                                        : "bg-primary"
                                    }`}
                                    style={{ width: `${Math.min(rate, 100)}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-bold font-mono ${
                                    rate >= 100
                                      ? "text-green-600"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  {achievedCount}/{targetValue}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
