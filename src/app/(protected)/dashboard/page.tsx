"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { MemberCard } from "@/app/(protected)/dashboard/_components/MemberCard";
import { WeeklyTable } from "@/app/(protected)/dashboard/_components/WeeklyTable";
import { useTeamDashboard } from "@/app/(protected)/dashboard/_hooks/useTeamDashboard";
import { formatWeekLabel } from "@/app/(protected)/dashboard/_lib/dashboard";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Calendar, UserIcon, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ActiveMemoState = {
  memberId: number;
  mode: "compose" | "view";
} | null;

export default function DashboardPage() {
  const { dashboard, hasNoWorkspace, isLoading, weekDates } =
    useTeamDashboard();
  const { data: profileResponse } = useGetUsersMe();
  const [activeMemoState, setActiveMemoState] = useState<ActiveMemoState>(null);
  const myUserId =
    profileResponse?.status === 200 ? (profileResponse.data.id ?? null) : null;
  const myNickname =
    profileResponse?.status === 200 ? profileResponse.data.nickname : null;
  const myAvatarKey =
    profileResponse?.status === 200 ? profileResponse.data.avatarKey : null;

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (hasNoWorkspace || !dashboard) {
    return <DashboardNoWorkspaceState />;
  }

  const weekLabel = formatWeekLabel(dashboard.weekStart, dashboard.weekEnd);
  const members = dashboard.members ?? [];
  const membersWithScoreboard = members.filter(
    (member) => member.hasScoreboard,
  );
  const currentUserRole =
    members.find((member) => member.userId === myUserId)?.role ?? null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-pretendard">
      <div
        className={`mx-auto max-w-[860px] p-4 md:p-8 animate-linear-in transition-transform duration-300 ease-out xl:origin-top ${
          activeMemoState ? "xl:-translate-x-28" : "xl:translate-x-0"
        }`}
      >
        <div className="space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-text-primary tracking-tight truncate">
                  {dashboard.workspaceName}
                </h1>
                <p className="text-[11px] text-text-muted truncate">
                  팀 전체 현황
                </p>
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
              <h2 className="text-sm font-bold text-text-primary">
                팀원 현황 요약
              </h2>
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
                  <MemberCard
                    key={member.userId}
                    member={member}
                    isMe={member.userId === myUserId}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          <section className="space-y-6 overflow-visible">
            <div className="px-1">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  팀 주간 점수판
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  팀원 전체의 이번 주 선행지표 달성 현황
                </p>
              </div>
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
                  isMe={member.userId === myUserId}
                  memoMode={
                    activeMemoState != null &&
                    activeMemoState.memberId === member.userId
                      ? activeMemoState.mode
                      : null
                  }
                  onToggleCompose={() =>
                    setActiveMemoState((prev) =>
                      prev != null &&
                      prev.memberId === member.userId &&
                      prev.mode === "compose"
                        ? null
                        : member.userId != null
                          ? { memberId: member.userId, mode: "compose" }
                          : null,
                    )
                  }
                  onToggleView={() =>
                    setActiveMemoState((prev) =>
                      prev != null &&
                      prev.memberId === member.userId &&
                      prev.mode === "view"
                        ? null
                        : member.userId != null
                          ? { memberId: member.userId, mode: "view" }
                          : null,
                    )
                  }
                  onCloseMemo={() => setActiveMemoState(null)}
                  currentUserId={myUserId}
                  currentUserNickname={myNickname}
                  currentUserAvatarKey={myAvatarKey}
                  currentUserRole={currentUserRole}
                />
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
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

function DashboardNoWorkspaceState() {
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
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}
