"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe, useGetWorkspaces, usePutWorkspacesCurrent } from "@/api/generated/workspace/workspace";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { useProfileActions } from "@/app/[locale]/(protected)/profile/_hooks/useProfileActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useToast } from "@/context/ToastContext";
import { useNativeApp } from "@/context/NativeAppContext";
import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { Link, useRouter } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function WorkspaceSettingsPage() {
  const t = useTranslations("Profile");
  const commonT = useTranslations("Common");
  const isNativeApp = useNativeApp();
  const router = useRouter();
  const { showToast } = useToast();
  
  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe();
  const { data: workspaceResponse, error: workspaceError, isLoading: isWorkspaceLoading } = useGetWorkspacesMe(
    { query: { retry: false } }
  );
  const { data: allWorkspacesResponse } = useGetWorkspaces();
  const { mutate: switchWorkspace, isPending: isSwitching } = usePutWorkspacesCurrent({
    mutation: {
      onSuccess: () => window.location.reload(),
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const workspace = !hasNoWorkspace && workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const workspaces = allWorkspacesResponse?.status === 200 ? allWorkspacesResponse.data : [];
  
  const workspacePlanCode = workspace?.planCode ?? "FREE";
  const showBillingSurface = publicRuntimeConfig.isDevelopment && !isNativeApp;
  const hasWorkspace = workspace !== null;
  const isWorkspaceAdmin = hasWorkspace && user?.role === "ADMIN";

  const {
    changeWorkspaceName,
    deleteWorkspace,
    isActionPending,
    leaveWorkspace,
    pendingAction,
  } = useProfileActions({
    nickname: user?.nickname ?? "",
    workspace,
  });


  useEffect(() => {
    if ((!isProfileLoading && !isWorkspaceLoading) && !hasWorkspace) {
      showToast("error", t("noWorkspaceTitle"));
      router.replace("/dashboard/my");
    }
  }, [isProfileLoading, isWorkspaceLoading, hasWorkspace, router, showToast, t]);

  const menuGroups: { id: string; label: string; items: MenuItem[] }[] = [
    {
      id: "general",
      label: t("workspaceSection"),
      items: hasWorkspace
        ? isWorkspaceAdmin
          ? [
              ...(showBillingSurface
                ? [
                    {
                      id: workspacePlanCode === "STANDARD" ? "billing" : "pricing",
                      icon: <DowinIcon name="domain-payment" className="w-4 h-4" />,
                      title: workspacePlanCode === "STANDARD" ? t("billingTitle") : t("pricingTitle"),
                      description: workspacePlanCode === "STANDARD" ? t("billingDesc") : t("pricingDesc"),
                      href: workspacePlanCode === "STANDARD" ? "/profile/billing" : "/pricing",
                    },
                  ]
                : []),
              {
                id: "workspace-name",
                icon: <DowinIcon name="action-edit" className="w-4 h-4" />,
                title: t("changeWorkspaceName"),
                description: t("changeWorkspaceNameDesc"),
                onClick: () => void changeWorkspaceName(),
              },
              {
                id: "members",
                icon: <DowinIcon name="domain-people" className="w-4 h-4" />,
                title: t("manageMembers"),
                description: t("manageMembersDesc"),
                href: "/profile/members",
              },
              {
                id: "invites",
                icon: <DowinIcon name="domain-ticket" className="w-4 h-4" />,
                title: t("manageInvites"),
                description: t("manageInvitesDesc"),
                href: "/profile/invites",
              },
              {
                id: "workspace-delete",
                icon: <DowinIcon name="action-delete" className="w-4 h-4" />,
                title: t("workspaceDelete"),
                description: t("workspaceDeleteDescFull"),
                danger: true,
                onClick: () => void deleteWorkspace(),
              },
            ]
          : [
              {
                id: "workspace-leave",
                icon: <DowinIcon name="auth-sign-out" className="w-4 h-4" />,
                title: t("workspaceLeave"),
                description: t("workspaceLeaveDescFull"),
                danger: true,
                onClick: () => void leaveWorkspace(),
              },
            ]
        : [],
    },
  ];

  if (isProfileLoading || isWorkspaceLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <ProtectedPageContainer isLoading>
          <div className="h-10 rounded-content bg-sub-background" />
          <div className="h-24 rounded-content bg-sub-background" />
        </ProtectedPageContainer>
      </div>
    );
  }

  if (!user || !hasWorkspace) return null;

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {isActionPending && (
        <LoadingOverlay
          message={
            pendingAction === "workspace-name"
              ? t("loadingWorkspaceName")
              : isSwitching
              ? commonT("processing")
              : t("processing")
          }
        />
      )}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={t("workspaceSection")}
          description={commonT("settings")}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12">
            
            {workspace?.isOverFreeMemberLimit && (
              <WorkspaceOverLimitBanner
                freeMemberLimit={workspace.freeMemberLimit}
                isAdmin={isWorkspaceAdmin}
                memberCount={workspace.memberCount}
              />
            )}

            <div className="mb-4 rounded-content border border-zinc-200 bg-white px-4 py-4 flex items-center justify-between gap-3 sm:px-8 sm:py-7">
              <div className="flex flex-col min-w-0 text-left">
                <p className="text-lg font-bold text-text-primary truncate tracking-tight">
                  {workspace.name}
                </p>
                <p className="text-xs font-medium text-text-secondary mt-1">
                  {isWorkspaceAdmin ? t("workspaceAdmin") : t("workspaceMember")}
                </p>
              </div>
              {!isNativeApp ? (
                <span className={`inline-flex items-center h-6 rounded-button px-2.5 text-[10px] font-black tracking-wider border ${
                    workspacePlanCode === "STANDARD"
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {workspacePlanCode}
                </span>
              ) : null}
            </div>

            {/* 설정 그룹들 */}
            <div className="space-y-8 pb-24 lg:space-y-16 lg:pb-[60vh]">
              {menuGroups.filter((group) => group.items.length > 0).map((group) => (
                  <section key={group.id} id={group.id} className="space-y-5">
                    <SectionHeader title={group.label} className="mb-4" />
                    <div className="border border-zinc-200 rounded-content overflow-hidden bg-white">
                      {group.items.map((item, index) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          isLast={index === group.items.length - 1}
                          isActionPending={isActionPending}
                        />
                      ))}
                    </div>
                  </section>
                ))}
                
                {/* 내 워크스페이스 목록 */}
                <section id="workspaces" className="space-y-5">
                  <SectionHeader title={commonT("Workspace")} className="mb-4" />
                  <div className="border border-zinc-200 rounded-content overflow-hidden bg-white">
                    {workspaces.map((ws, index) => (
                      <div
                        key={ws.id}
                        className={`flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 ${
                          index !== workspaces.length - 1 ? "border-b border-zinc-100" : ""
                        }`}
                      >
                        <div className="flex flex-col min-w-0 text-left">
                          <p className={`text-[14px] font-bold ${ws.id === workspace?.id ? "text-primary" : "text-text-primary"}`}>
                            {ws.name}
                            {ws.id === workspace?.id && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}
                          </p>
                        </div>
                        {ws.id !== workspace?.id && (
                          <button
                            onClick={() => switchWorkspace({ data: { workspaceId: ws.id ?? 0 } })}
                            disabled={isSwitching}
                            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors bg-zinc-100 px-3 py-1.5 rounded-button"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-zinc-100">
                      <Link
                        href="/workspace/new"
                        className="flex w-full items-center px-4 py-4 sm:px-6 sm:py-5 text-sm transition-colors hover:bg-zinc-50 text-primary font-bold gap-3"
                      >
                        <div className="w-9 h-9 rounded-button border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0">
                          <DowinIcon name="action-add-active" size="16px" className="text-primary" />
                        </div>
                        {commonT("createWorkspace")}
                      </Link>
                    </div>
                  </div>
                </section>
            </div>
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function MenuItemRow({ item, isLast, isActionPending }: { item: MenuItem; isLast: boolean; isActionPending: boolean; }) {
  const itemWrapperClassName = isLast ? "" : "border-b border-zinc-100";
  const Content = (
    <div className="flex w-full items-center justify-between gap-4 px-4 py-4 transition-colors sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className={`w-9 h-9 rounded-button border flex items-center justify-center flex-shrink-0 ${
            item.danger
              ? "border-danger/10 bg-danger/5 text-danger"
              : "border-border/50 bg-sub-background text-text-muted"
          }`}
        >
          {item.icon}
        </div>
        <div className="text-left min-w-0">
          <p className={`text-[14px] font-bold ${item.danger ? "text-danger" : "text-text-primary"}`}>
            {item.title}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">{item.description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {item.rightElement ? item.rightElement : <DowinIcon name="nav-chevron-right" className="w-4 h-4 text-text-muted/50" />}
      </div>
    </div>
  );

  if (item.onClick) {
    return (
      <div className={itemWrapperClassName}>
        <button disabled={isActionPending} onClick={item.onClick} className="w-full bg-white text-left">
          {Content}
        </button>
      </div>
    );
  }

  if (item.href) {
    return (
      <div className={itemWrapperClassName}>
        <Link href={item.href} className="block w-full bg-white">
          {Content}
        </Link>
      </div>
    );
  }

  return <div className={`w-full bg-white ${itemWrapperClassName}`}>{Content}</div>;
}
