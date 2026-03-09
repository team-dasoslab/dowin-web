"use client";

import { useMockData } from "@/context/MockDataContext";
import {
  ArrowLeft,
  Check,
  Plus,
  Settings,
  Target,
  User as UserIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const getWeekDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

export default function MyDashboardPage() {
  const { user, scoreboard, updateLog, workspaceName } = useMockData();
  const router = useRouter();
  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) router.push("/");
    setWeekDates(getWeekDates());
  }, [user, router]);

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";

  // ── 점수판 없음 ─────────────────────────────────────────────
  if (!scoreboard) {
    return (
      <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
        <div className="max-w-[400px] w-full space-y-8 animate-linear-in">
          {/* 아이콘 */}
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="text-primary w-7 h-7" />
          </div>

          {/* 텍스트 */}
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

          {/* CTA */}
          <Link
            href="/setup?mode=create"
            className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
          >
            <Plus className="w-4 h-4" />새 점수판 만들기
          </Link>
        </div>
      </div>
    );
  }

  const activeLeadMeasures = scoreboard.leadMeasures.filter(
    (lm) => lm.status === "ACTIVE",
  );

  // 이번 주 달성률 계산 (각 지표별 달성률의 평균)
  const totalRate = activeLeadMeasures.reduce((acc, lm) => {
    // 이번 주(월~일) 동안 달성한 횟수
    const weeklyAchievedCount = weekDates.filter(
      (date) => date <= today && lm.logs.find((l) => l.logDate === date)?.value,
    ).length;

    // 지표별 이번 주 목표치 계산
    // DAILY: 입력받은 targetValue 자체가 "주간 목표 횟수"로 쓰임 (예: 주 7회)
    // WEEKLY: 입력받은 targetValue가 "주간 목표 횟수" (예: 주 3회)
    // MONTHLY: 이번 주는 1회만 해도 100% 달성으로 간주 (또는 주간 목표치 산출)
    let weeklyTarget = lm.targetValue;
    if (lm.period === "MONTHLY") {
      weeklyTarget = Math.max(1, Math.round(lm.targetValue / 4));
    }

    // 개별 지표의 달성률 (최대 100% 초과 방지)
    const lmRate = Math.min((weeklyAchievedCount / weeklyTarget) * 100, 100);
    return acc + lmRate;
  }, 0);

  const overallRate =
    activeLeadMeasures.length > 0
      ? Math.round(totalRate / activeLeadMeasures.length)
      : 0;

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* 팀 대시보드로 뒤로가기 */}
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted truncate">
                {workspaceName}
              </p>
              <h1 className="text-sm font-bold text-text-primary truncate">
                {user.nickname}님의 점수판
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/setup?mode=update"
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <Settings className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>점수판 관리</span>
            </Link>
            <Link
              href="/profile"
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <UserIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>내 프로필</span>
            </Link>
          </div>
        </header>

        {/* ── WIG 카드 ── */}
        <section className="border border-border rounded-lg overflow-hidden">
          {/* 상단: 가중목 */}
          <div className="px-6 py-4 flex items-start gap-4 border-b border-border">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                가중목
              </p>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                {scoreboard.goalName}
              </h2>
            </div>

            {/* 주간 달성률 */}
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

          {/* 하단: 후행지표 */}
          <div className="px-6 py-3 bg-sub-background flex items-center gap-3">
            <Target className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mr-3">
                후행지표
              </span>
              <span className="text-sm text-text-primary font-medium">
                {scoreboard.lagMeasure}
              </span>
            </div>
          </div>
        </section>

        {/* ── 주간 점수판 ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-text-primary">
              주간 선행지표
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
                {weekLabel}
              </span>
              <Link
                href="/setup?mode=addMeasure"
                className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-[11px] font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                지표 추가
              </Link>
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
                  {/* 테이블 헤더 */}
                  <div className="bg-sub-background border-b border-border">
                    <table className="w-full table-fixed text-xs">
                      <colgroup>
                        <col className="w-[38%]" />
                        {DAY_LABELS.map((_, i) => (
                          <col key={i} className="w-[8%]" />
                        ))}
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="py-3 px-5 text-left text-[11px] font-bold text-text-muted uppercase tracking-widest">
                            선행지표
                          </th>
                          {DAY_LABELS.map((day, i) => (
                            <th
                              key={i}
                              className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                                weekDates[i] === today
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

                  {/* 테이블 바디 */}
                  <table className="w-full table-fixed text-xs">
                    <colgroup>
                      <col className="w-[38%]" />
                      {DAY_LABELS.map((_, i) => (
                        <col key={i} className="w-[8%]" />
                      ))}
                      <col className="w-[14%]" />
                    </colgroup>
                    <tbody className="divide-y divide-border">
                      {activeLeadMeasures.map((lm) => {
                        const achievedCount = weekDates.filter(
                          (date) =>
                            lm.logs.find((l) => l.logDate === date)?.value,
                        ).length;
                        const rate = Math.round(
                          (achievedCount / lm.targetValue) * 100,
                        );

                        return (
                          <tr key={lm.id} className="bg-white">
                            {/* 지표명 */}
                            <td className="py-4 px-5">
                              <Link
                                href={`/measure/${lm.id}`}
                                className="block font-semibold text-text-primary hover:text-primary transition-colors truncate text-sm"
                              >
                                {lm.name}
                              </Link>
                              <span className="text-[10px] text-text-muted">
                                목표 {lm.targetValue}회 /{" "}
                                {lm.period === "DAILY"
                                  ? "일"
                                  : lm.period === "WEEKLY"
                                    ? "주"
                                    : "월"}
                              </span>
                            </td>

                            {/* 요일별 O/X 토글 */}
                            {weekDates.map((date, i) => {
                              const isAchieved = lm.logs.find(
                                (l) => l.logDate === date,
                              )?.value;
                              const isFuture = date > today;
                              const isToday = date === today;

                              return (
                                <td key={date} className="py-3 text-center">
                                  <button
                                    onClick={() =>
                                      updateLog(lm.id, date, !isAchieved)
                                    }
                                    className={`
                                  w-7 h-7 mx-auto rounded-md flex items-center justify-center transition-colors cursor-pointer
                                  ${
                                    isAchieved
                                      ? "bg-primary text-white"
                                      : isToday
                                        ? "bg-primary/5 border border-primary/30 text-text-muted"
                                        : date > today
                                          ? "bg-sub-background border border-dashed border-border text-text-muted/30"
                                          : "bg-sub-background border border-border text-text-muted/40"
                                  }
                                `}
                                  >
                                    {isAchieved ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <span className="text-[9px] font-bold">
                                        {date > today ? "" : "✕"}
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}

                            {/* 달성률 */}
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
                                  {achievedCount}/{lm.targetValue}
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
