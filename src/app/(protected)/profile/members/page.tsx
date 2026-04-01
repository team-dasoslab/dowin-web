"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspacesIdMembers,
  useGetWorkspacesMe,
} from "@/api/generated/workspace/workspace";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { MemberListItem } from "@/app/(protected)/profile/members/_components/MemberListItem";
import { useRemoveWorkspaceMember } from "@/app/(protected)/profile/members/_hooks/useRemoveWorkspaceMember";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { Shield, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function ProfileMembersPage() {
  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 2,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const workspaceId = workspace?.id ?? 0;
  const isWorkspaceAdmin = user?.role === "ADMIN";

  const { data: membersResponse, isLoading: isMembersLoading } =
    useGetWorkspacesIdMembers(workspaceId, {
      query: {
        enabled: workspaceId > 0 && isWorkspaceAdmin,
        retry: false,
      },
    });

  const { pendingDeleteMemberId, removeMember } = useRemoveWorkspaceMember({
    workspaceId,
  });

  const members = useMemo(() => {
    if (membersResponse?.status !== 200) {
      return [];
    }

    return [...membersResponse.data].sort((left, right) => {
      if (left.role === right.role) {
        return (left.nickname ?? "").localeCompare(right.nickname ?? "");
      }

      return left.role === "ADMIN" ? -1 : 1;
    });
  }, [membersResponse]);

  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const isLoading =
    isProfileLoading ||
    isWorkspaceLoading ||
    (isWorkspaceAdmin && isMembersLoading);

  if (isLoading) {
    return <MembersPageSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!user || !workspace || !isWorkspaceAdmin) {
    return <NoAccessState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[720px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">멤버 관리</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              현재 {members.length}명의 멤버가 함께하고 있습니다.
            </p>
          </div>
        </Card>

        <Card className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              초대코드 관리
            </h2>
            <p className="text-[11px] text-text-muted">
              멤버 초대는 초대코드 관리 페이지에서 진행합니다.
            </p>
          </div>
          <Button
            asChild
            className="btn-linear-primary rounded-lg px-3 py-2 text-xs font-bold"
          >
            <Link href="/profile/invites" className="flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5" />
              초대코드 관리
            </Link>
          </Button>
        </Card>

        <Card className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">현재 멤버</h2>
            <p className="text-[11px] text-text-muted">
              관리자는 멤버를 퇴출할 수 있지만, 자기 자신이나 마지막 관리자는
              퇴출할 수 없습니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {members.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-text-muted">
                아직 등록된 멤버가 없습니다.
              </div>
            ) : (
              members.map((member, index) => {
                const nickname = member.nickname ?? "이름 없음";

                return (
                  <MemberListItem
                    key={member.id ?? `${nickname}-${index}`}
                    member={member}
                    index={index}
                    totalCount={members.length}
                    isPendingDelete={pendingDeleteMemberId === (member.id ?? 0)}
                    onRemove={(memberId, memberNickname) => {
                      void removeMember(memberId, memberNickname);
                    }}
                  />
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MembersPageSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[720px] animate-pulse space-y-6 p-4 md:p-8">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="h-72 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-lg border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              워크스페이스가 없어요
            </h1>
            <p className="text-sm text-text-muted">
              멤버 관리는 워크스페이스를 만든 뒤 사용할 수 있습니다.
            </p>
          </div>
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}

function NoAccessState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-lg border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              관리자만 접근할 수 있어요
            </h1>
            <p className="text-sm text-text-muted">
              멤버 퇴출과 초대코드 관리는 현재 워크스페이스의 관리자만 할 수
              있습니다.
            </p>
          </div>
          <Button
            asChild
            className="w-full rounded-lg border border-border bg-white py-3 text-sm font-semibold text-text-primary"
          >
            <Link href="/profile">설정으로 돌아가기</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
