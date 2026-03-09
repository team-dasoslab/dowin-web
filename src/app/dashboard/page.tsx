"use client";

import { Scoreboard, User, useMockData } from "@/context/MockDataContext";
import { Calendar, Target, UserIcon, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Helper: get this week's Mon–Sun date strings
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

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// ── 팀원 요약 카드 ──────────────────────────────────────────────
interface MemberCardProps {
  user: User;
  scoreboard: Scoreboard;
  weekDates: string[];
}

const MemberCard: React.FC<MemberCardProps> = ({
  user,
  scoreboard,
  weekDates,
}) => {
  const activeLeadMeasures = scoreboard.leadMeasures.filter(
    (lm) => lm.status === "ACTIVE",
  );

  // 이번 주 달성률 계산 (각 지표별 달성률의 평균)
  const today = new Date().toISOString().split("T")[0];

  const totalRate = activeLeadMeasures.reduce((acc, lm) => {
    const weeklyAchievedCount = weekDates.filter(
      (date) => date <= today && lm.logs.find((l) => l.logDate === date)?.value,
    ).length;

    let weeklyTarget = lm.targetValue;
    if (lm.period === "MONTHLY") {
      weeklyTarget = Math.max(1, Math.round(lm.targetValue / 4));
    }

    // 개별 지표의 달성률 (최대 100%)
    const lmRate = Math.min((weeklyAchievedCount / weeklyTarget) * 100, 100);
    return acc + lmRate;
  }, 0);

  const rate =
    activeLeadMeasures.length > 0
      ? Math.round(totalRate / activeLeadMeasures.length)
      : 0;

  // UI용 요약 (단순히 총 달성 건수 / 총 목표 건수)
  const totalAchievedCount = activeLeadMeasures.reduce((acc, lm) => {
    return (
      acc +
      weekDates.filter((date) => lm.logs.find((l) => l.logDate === date)?.value)
        .length
    );
  }, 0);
  const totalTargetCount = activeLeadMeasures.reduce((acc, lm) => {
    let weeklyTarget = lm.targetValue;
    if (lm.period === "MONTHLY") {
      weeklyTarget = Math.max(1, Math.round(lm.targetValue / 4));
    }
    return acc + weeklyTarget;
  }, 0);

  const rateColor =
    rate >= 80
      ? "text-green-700 bg-green-50 border-green-200"
      : rate >= 50
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="bg-white border border-border rounded-lg p-5 space-y-4 hover:border-[rgba(205,207,213,1)] transition-colors">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {user.nickname}
            </p>
            <p className="text-xs text-text-muted truncate">
              {scoreboard.goalName}
            </p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${rateColor}`}
        >
          {rate}%
        </span>
      </div>

      {/* 후행지표 */}
      <div className="flex items-center gap-2 text-xs text-text-secondary bg-sub-background border border-border rounded px-3 py-2">
        <Target className="w-3 h-3 text-text-muted flex-shrink-0" />
        <span className="truncate">{scoreboard.lagMeasure}</span>
      </div>

      {/* 진행률 바 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-text-muted">
          <span>이번 주 달성도</span>
          <span className="font-mono">
            {totalAchievedCount} / {totalTargetCount}
          </span>
        </div>
        <div className="h-1.5 w-full bg-sub-background rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
      </div>

      {/* 선행지표 목록 */}
      {activeLeadMeasures.length > 0 && (
        <ul className="space-y-1">
          {activeLeadMeasures.map((lm) => {
            const lmAchieved = weekDates.filter(
              (date) => lm.logs.find((l) => l.logDate === date)?.value,
            ).length;
            return (
              <li
                key={lm.id}
                className="flex justify-between items-center text-[11px]"
              >
                <span className="text-text-secondary truncate max-w-[75%]">
                  {lm.name}
                </span>
                <span className="font-mono text-text-muted flex-shrink-0">
                  {lmAchieved}/{lm.targetValue}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ── 주간 점수판 테이블 (읽기 전용) ────────────────────────────
interface WeeklyTableProps {
  user: User;
  scoreboard: Scoreboard;
  weekDates: string[];
}

const WeeklyTable: React.FC<WeeklyTableProps> = ({
  user,
  scoreboard,
  weekDates,
}) => {
  const activeLeadMeasures = scoreboard.leadMeasures.filter(
    (lm) => lm.status === "ACTIVE",
  );
  const today = new Date().toISOString().split("T")[0];

  if (activeLeadMeasures.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* 팀원 이름 헤더 */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
          <UserIcon className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-bold text-text-primary">
          {user.nickname}
        </span>
        <span className="text-xs text-text-muted">— {scoreboard.goalName}</span>
      </div>

      {/* 테이블 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-sub-background border-b border-border">
              <th className="text-left px-3 py-2 text-text-secondary font-medium w-[40%]">
                선행지표
              </th>
              {weekDates.map((date, i) => (
                <th
                  key={date}
                  className={`text-center px-1 py-2 font-medium w-[8%] ${
                    date === today
                      ? "text-primary"
                      : date > today
                        ? "text-text-muted/50"
                        : "text-text-secondary"
                  }`}
                >
                  {DAY_LABELS[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeLeadMeasures.map((lm, idx) => (
              <tr
                key={lm.id}
                className={
                  idx < activeLeadMeasures.length - 1
                    ? "border-b border-border"
                    : ""
                }
              >
                <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-0">
                  <span className="block truncate">{lm.name}</span>
                </td>
                {weekDates.map((date) => {
                  const achieved = lm.logs.find(
                    (l) => l.logDate === date,
                  )?.value;
                  const isFuture = date > today;
                  return (
                    <td
                      key={date}
                      className={`text-center px-1 py-2.5 ${isFuture ? "opacity-30" : ""}`}
                    >
                      {isFuture ? (
                        <span className="text-text-muted">·</span>
                      ) : achieved ? (
                        <span className="text-green-600 font-bold text-sm">
                          ○
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold text-sm">
                          ✕
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── 메인 페이지 ───────────────────────────────────────────────
export default function DashboardPage() {
  const { user, allScoreboards, mockUsers, workspaceName } = useMockData();
  const router = useRouter();
  const weekDates = getWeekDates();

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  if (!user) return null;

  const activeScoreboards = allScoreboards.filter(
    (sb) => sb.status === "ACTIVE",
  );

  // 이번 주 날짜 범위 표시
  const weekLabel = `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`;

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-primary tracking-tight truncate">
                {workspaceName}
              </h1>
              <p className="text-[11px] text-text-muted truncate">
                팀 전체 현황
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/my"
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>나의 대시보드</span>
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

        {/* ── 섹션 1: 팀원 요약 카드 ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-text-primary">팀원 현황</h2>
            <span className="text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
              {weekLabel}
            </span>
          </div>

          {activeScoreboards.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              아직 활성화된 점수판이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeScoreboards.map((sb) => {
                const member = mockUsers.find((u) => u.id === sb.userId);
                if (!member) return null;
                return (
                  <MemberCard
                    key={sb.id}
                    user={member}
                    scoreboard={sb}
                    weekDates={weekDates}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── 구분선 ── */}
        <div className="border-t border-border" />

        {/* ── 섹션 2: 팀 주간 점수판 ── */}
        <section className="space-y-6">
          <div className="px-1">
            <h2 className="text-sm font-bold text-text-primary">
              팀 주간 점수판
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              팀원 전체의 이번 주 선행지표 달성 현황
            </p>
          </div>

          {activeScoreboards.map((sb) => {
            const member = mockUsers.find((u) => u.id === sb.userId);
            if (!member) return null;
            return (
              <WeeklyTable
                key={sb.id}
                user={member}
                scoreboard={sb}
                weekDates={weekDates}
              />
            );
          })}
        </section>
      </div>
    </div>
  );
}
