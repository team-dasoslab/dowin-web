"use client";

import { useTeamDashboard } from "@/app/(protected)/dashboard/_hooks/useTeamDashboard";
import { TeamDashboardMember } from "@/api/generated/wig.schemas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Calendar, Target, UserIcon, Users, Zap } from "lucide-react";
import Link from "next/link";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const formatWeekLabel = (weekStart?: string, weekEnd?: string) => {
  if (!weekStart || !weekEnd) {
    return "";
  }

  return `${weekStart.slice(5).replace("-", ".")} – ${weekEnd.slice(5).replace("-", ".")}`;
};

const getRateTone = (rate: number) => {
  if (rate >= 80) {
    return "text-green-700 bg-green-50 border-green-200";
  }

  if (rate >= 50) {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }

  return "text-red-700 bg-red-50 border-red-200";
};

function MemberCard({ member }: { member: TeamDashboardMember }) {
  const achievementRate = member.achievementRate ?? 0;
  const achieved = member.achieved ?? 0;
  const total = member.total ?? 0;
  const hasScoreboard = member.hasScoreboard ?? false;

  return (
    <Card className="bg-white border border-border rounded-lg p-5 space-y-4 hover:border-[rgba(205,207,213,1)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {member.nickname}
            </p>
            <p className="text-xs text-text-muted truncate">
              {hasScoreboard ? member.goalName : "활성 점수판 없음"}
            </p>
          </div>
        </div>
        <Badge
          className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${getRateTone(achievementRate)}`}
        >
          {hasScoreboard ? `${achievementRate}%` : "미설정"}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-secondary bg-sub-background border border-border rounded px-3 py-2">
        <Target className="w-3 h-3 text-text-muted flex-shrink-0" />
        <span className="truncate">
          {hasScoreboard
            ? member.lagMeasure
            : "점수판을 만들면 팀 대시보드에 집계됩니다."}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-text-muted">
          <span>이번 주 달성도</span>
          <span className="font-mono">
            {achieved} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full bg-sub-background rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(achievementRate, 100)}%` }}
          />
        </div>
      </div>

      {hasScoreboard && (member.leadMeasures?.length ?? 0) > 0 ? (
        <ul className="space-y-1">
          {member.leadMeasures?.map((leadMeasure) => (
            <li
              key={leadMeasure.id}
              className="flex justify-between items-center text-[11px]"
            >
              <span className="text-text-secondary truncate max-w-[75%]">
                {leadMeasure.name}
              </span>
              <span className="font-mono text-text-muted flex-shrink-0">
                {leadMeasure.achieved}/{leadMeasure.targetValue}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function WeeklyTable({
  member,
  weekDates,
}: {
  member: TeamDashboardMember;
  weekDates: string[];
}) {
  if (!(member.hasScoreboard ?? false) || (member.leadMeasures?.length ?? 0) === 0) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
          <UserIcon className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-bold text-text-primary">
          {member.nickname}
        </span>
        <span className="text-xs text-text-muted">— {member.goalName}</span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="bg-sub-background border-b border-border">
                <th className="text-left px-3 py-2 text-text-secondary font-medium w-[40%]">
                  선행지표
                </th>
                {weekDates.map((date, index) => (
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
                    {DAY_LABELS[index]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {member.leadMeasures?.map((leadMeasure, index) => (
                <tr
                  key={leadMeasure.id}
                  className={
                    index < (member.leadMeasures?.length ?? 0) - 1
                      ? "border-b border-border"
                      : ""
                  }
                >
                  <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-0">
                    <span className="block truncate">{leadMeasure.name}</span>
                  </td>
                  {weekDates.map((date) => {
                    const value = leadMeasure.logs?.[date] ?? null;
                    const isFuture = date > today;
                    return (
                      <td
                        key={date}
                        className={`text-center px-1 py-2.5 ${isFuture ? "opacity-30" : ""}`}
                      >
                        {isFuture ? (
                          <span className="text-text-muted">·</span>
                        ) : value === true ? (
                          <span className="text-green-600 font-bold text-sm">○</span>
                        ) : value === false ? (
                          <span className="text-red-400 font-bold text-sm">✕</span>
                        ) : (
                          <span className="text-text-muted">·</span>
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
    </div>
  );
}

export default function DashboardPage() {
  const { dashboard, hasNoWorkspace, isLoading, weekDates } = useTeamDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-pretendard">
        <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-sub-background" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-48 rounded-2xl bg-sub-background" />
            <div className="h-48 rounded-2xl bg-sub-background" />
          </div>
          <div className="h-64 rounded-2xl bg-sub-background" />
        </div>
      </div>
    );
  }

  if (hasNoWorkspace || !dashboard) {
    return (
      <div className="min-h-screen bg-background font-pretendard">
        <div className="max-w-[720px] mx-auto p-4 md:p-8">
          <Card className="card-linear p-8 text-center space-y-4">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">
              아직 워크스페이스가 없습니다
            </h1>
            <p className="text-sm text-text-secondary">
              팀 대시보드를 보려면 먼저 워크스페이스에 참가해야 합니다.
            </p>
            <Button asChild className="btn-linear-primary px-4 py-2 text-sm">
              <Link href="/workspace/new">워크스페이스 만들기</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const weekLabel = formatWeekLabel(dashboard.weekStart, dashboard.weekEnd);
  const members = dashboard.members ?? [];
  const membersWithScoreboard = members.filter((member) => member.hasScoreboard);

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-primary tracking-tight truncate">
                {dashboard.workspaceName}
              </h1>
              <p className="text-[11px] text-text-muted truncate">팀 전체 현황</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
            >
              <Link href="/dashboard/my">
                <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>나의 대시보드</span>
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

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-text-primary">팀원 현황</h2>
            <span className="text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
              {weekLabel}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              아직 팀원이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-border" />

        <section className="space-y-6">
          <div className="px-1">
            <h2 className="text-sm font-bold text-text-primary">
              팀 주간 점수판
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              팀원 전체의 이번 주 선행지표 달성 현황
            </p>
          </div>

          {membersWithScoreboard.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              아직 활성화된 점수판이 없습니다.
            </div>
          ) : (
            membersWithScoreboard.map((member) => (
              <WeeklyTable
                key={member.userId}
                member={member}
                weekDates={weekDates}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
