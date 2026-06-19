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
import { MemberListItem } from "@/app/[locale]/(protected)/workspace/members/_components/MemberListItem";
import { useRemoveWorkspaceMember } from "@/app/[locale]/(protected)/workspace/members/_hooks/useRemoveWorkspaceMember";
import { useTransferWorkspaceAdmin } from "@/app/[locale]/(protected)/workspace/members/_hooks/useTransferWorkspaceAdmin";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { useTranslations } from "next-intl";

export default function ProfileMembersPage() {
  const t = useTranslations("ProfileMembers");
  const workspaceParamId = useParams().workspaceId as string | undefined;
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
  const workspaceId = workspace?.id ?? "";
  const isWorkspaceAdmin = workspace?.role === "ADMIN";

  const { data: membersResponse, isLoading: isMembersLoading } =
    useGetWorkspacesIdMembers(workspaceId, {
      query: {
        enabled: Boolean(workspaceId) && isWorkspaceAdmin,
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

  const memberLimit = workspace.freeMemberLimit ?? 10;
  const isAtOrOverMemberLimit =
    workspace.isOverFreeMemberLimit || members.length >= memberLimit;

  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="max-w-[640px] pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader title={t("header")} />

        <div className="flex items-center justify-between gap-4 rounded-[24px] bg-surface p-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
              <DowinIcon name="domain-people" size="20px" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-text-primary">
                {workspace.name}
              </h1>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {t("membersCountDesc", { count: members.length })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <Button
              asChild
              className="h-10 rounded-[12px] bg-sub-background px-5 text-sm font-bold text-text-secondary transition-colors hover:bg-border"
            >
              <Link
                href={getWorkspacePath(workspaceParamId, "/workspace/invites")}
              >
                {t("invitesCardButton")}
              </Link>
            </Button>
          </div>
        </div>

        {workspace.isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount ?? members.length}
          />
        ) : null}

        <div className="space-y-4 rounded-[24px] bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-text-primary">
                {t("currentMembersTitle")}
              </h2>
            </div>
            <div
              className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-bold tracking-tight ${
                isAtOrOverMemberLimit
                  ? "bg-danger/10 text-danger"
                  : "bg-sub-background text-text-secondary"
              }`}
            >
              <span>{members.length}</span>
              <span
                className={
                  isAtOrOverMemberLimit ? "text-red-400" : "text-text-muted"
                }
              >
                / {memberLimit}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {members.length === 0 ? (
              <div className="bg-surface px-4 py-10 text-center text-sm text-text-muted">
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
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function MembersPageSkeleton() {
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer
        isLoading
        className="max-w-[640px] pb-24 md:pb-10 lg:pb-12"
      >
        <div className="h-12 w-48 rounded-[12px] bg-border" />
        <div className="h-24 rounded-[24px] bg-border" />
        <div className="h-72 rounded-[24px] bg-border" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileMembers");
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-4 rounded-[24px] bg-surface p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <Logo size="24px" />
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
        </div>
      </div>
    </div>
  );
}

function NoAccessState() {
  const t = useTranslations("ProfileMembers");
  const workspaceId = useParams().workspaceId as string | undefined;
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-4 rounded-[24px] bg-surface p-6 text-center">
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
            className="w-full rounded-content border border-border bg-surface py-3 text-sm font-semibold text-text-primary"
          >
            <Link href={getWorkspacePath(workspaceId, "/profile")}>
              {t("backToSettings")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
