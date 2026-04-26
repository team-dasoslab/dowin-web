"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspacesIdMembers,
  useGetWorkspacesMe,
} from "@/api/generated/workspace/workspace";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { MemberListItem } from "@/app/[locale]/(protected)/profile/members/_components/MemberListItem";
import { useRemoveWorkspaceMember } from "@/app/[locale]/(protected)/profile/members/_hooks/useRemoveWorkspaceMember";
import { useTransferWorkspaceAdmin } from "@/app/[locale]/(protected)/profile/members/_hooks/useTransferWorkspaceAdmin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useMemo } from "react";

import { useTranslations } from "next-intl";

export default function ProfileMembersPage() {
  const t = useTranslations("ProfileMembers");
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
  const { pendingTransferMemberId, transferAdmin } = useTransferWorkspaceAdmin({
    workspaceId,
  });

  const members = useMemo(() => {
    if (membersResponse?.status !== 200) {
      return [];
    }

    return [...membersResponse.data].sort((left, right) => {
      const leftName = left.nickname ?? t("defaultNickname");
      const rightName = right.nickname ?? t("defaultNickname");
      if (left.role === right.role) {
        return leftName.localeCompare(rightName);
      }

      return left.role === "ADMIN" ? -1 : 1;
    });
  }, [membersResponse, t]);

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
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer>
        <ProtectedPageHeader title={t("header")} />

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DowinIcon name="domain-people" size="20px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              {t("membersCountDesc", { count: members.length })}
            </p>
          </div>
        </Card>

        {workspace.isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount ?? members.length}
          />
        ) : null}

        <Card className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("invitesCardTitle")}
            </h2>
            <p className="text-[11px] text-text-muted">
              {t("invitesCardDesc")}
            </p>
          </div>
          <Button
            asChild
            className="btn-dowin-primary rounded-content px-3 py-2 text-xs font-bold"
          >
            <Link href="/profile/invites" className="flex items-center gap-1.5">
              <DowinIcon name="domain-ticket-diagonal" size="14px" />
              {t("invitesCardButton")}
            </Link>
          </Button>
        </Card>

        <Card className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("currentMembersTitle")}
              <span
                className={`ml-2 text-xs font-semibold ${workspace.planCode !== "STANDARD" && members.length >= 10 ? "text-danger" : "text-text-secondary"}`}
              >
                {workspace.planCode === "STANDARD"
                  ? members.length
                  : `${members.length} / 10`}
              </span>
            </h2>
            <p className="text-[11px] text-text-muted">
              {t("currentMembersDesc")}
            </p>
          </div>

          <div className="overflow-hidden rounded-content border border-border">
            {members.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-text-muted">
                {t("noMembers")}
              </div>
            ) : (
              members.map((member, index) => {
                return (
                  <MemberListItem
                    key={member.id ?? `${member.nickname ?? "n"}-${index}`}
                    member={member}
                    index={index}
                    totalCount={members.length}
                    isPendingDelete={pendingDeleteMemberId === (member.id ?? 0)}
                    isPendingTransfer={
                      pendingTransferMemberId === (member.id ?? 0)
                    }
                    onRemove={(memberId, memberNickname) => {
                      void removeMember(memberId, memberNickname);
                    }}
                    onTransferAdmin={(memberId, memberNickname) => {
                      void transferAdmin(memberId, memberNickname);
                    }}
                  />
                );
              })
            )}
          </div>
        </Card>
      </ProtectedPageContainer>
    </div>
  );
}

function MembersPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-sub-background" />
        <div className="h-24 rounded-content bg-sub-background" />
        <div className="h-72 rounded-content bg-sub-background" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileMembers");
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-content border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <DowinIcon name="domain-people" size="20px" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              {t("noWorkspaceTitle")}
            </h1>
            <p className="text-sm text-text-muted">{t("noWorkspaceDesc")}</p>
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
  const t = useTranslations("ProfileMembers");
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-content border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <DowinIcon name="status-locked" size="20px" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              {t("noAccessTitle")}
            </h1>
            <p className="text-sm text-text-muted">{t("noAccessDesc")}</p>
          </div>
          <Button
            asChild
            className="w-full rounded-content border border-border bg-white py-3 text-sm font-semibold text-text-primary"
          >
            <Link href="/profile">{t("backToSettings")}</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
