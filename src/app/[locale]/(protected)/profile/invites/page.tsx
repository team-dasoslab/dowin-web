"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspacesIdInvites,
  useGetWorkspacesMe,
} from "@/api/generated/workspace/workspace";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { useInviteActions } from "@/app/[locale]/(protected)/profile/invites/_hooks/useInviteActions";
import { useInviteForm } from "@/app/[locale]/(protected)/profile/invites/_hooks/useInviteForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useNativeApp } from "@/context/NativeAppContext";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

export default function ProfileInvitesPage() {
  const t = useTranslations("ProfileInvites");
  const isNativeApp = useNativeApp();
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
  const isWorkspaceAdmin = user?.role === "ADMIN";

  const { data: invitesResponse, isLoading: isInvitesLoading } =
    useGetWorkspacesIdInvites(workspaceId, {
      query: {
        enabled: Boolean(workspaceId) && isWorkspaceAdmin,
        retry: false,
      },
    });

  const invites = useMemo(() => {
    if (invitesResponse?.status !== 200) {
      return [];
    }

    return [...invitesResponse.data].sort(
      (left, right) => (right.id ?? 0) - (left.id ?? 0),
    );
  }, [invitesResponse]);

  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const isLoading =
    isProfileLoading ||
    isWorkspaceLoading ||
    (isWorkspaceAdmin && isInvitesLoading);
  const {
    formError,
    maxUsesInput,
    getValidatedMaxUses,
    handleMaxUsesInputChange,
    selectPresetMaxUses,
  } = useInviteForm();
  const {
    copiedInviteId,
    createInvite,
    copyInviteCode,
    isCreatingInvite,
    pendingToggleInviteId,
    toggleInviteStatus,
  } = useInviteActions({
    workspaceId,
  });

  const activeInviteCount = invites.filter(
    (invite) => invite.status === "ACTIVE",
  ).length;
  const isOverFreeMemberLimit = Boolean(workspace?.isOverFreeMemberLimit);

  const handleCreateInvite = async () => {
    const maxUses = getValidatedMaxUses();
    if (maxUses === null) {
      return;
    }

    await createInvite(maxUses);
  };

  if (isLoading) {
    return <InvitePageSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!user || !workspace || !isWorkspaceAdmin) {
    return <NoAccessState />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ProtectedPageContainer>
        <ProtectedPageHeader title={t("header")} />

        <Card className="flex items-center gap-4 rounded-content border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <DowinIcon name="domain-ticket-diagonal" size="20px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              {t("invitesCountDesc", {
                total: invites.length,
                active: activeInviteCount,
              })}
            </p>
          </div>
        </Card>

        {isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount}
          />
        ) : null}

        <Card className="space-y-4 rounded-content border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("newInviteTitle")}
            </h2>
            <p className="text-[11px] text-text-muted">{t("newInviteDesc")}</p>
          </div>

          <div className="space-y-3 rounded-content border border-border bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-text-secondary">
                {t("maxUsesLabel")}
              </p>
              <p className="text-[11px] text-text-muted">{t("maxUsesLimit")}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-content border border-border bg-white px-3 text-xs text-text-secondary">
                <span className="shrink-0 text-[11px]">
                  {t("maxUsesInputLabel")}
                </span>
                <Input
                  id="max-uses"
                  type="number"
                  min={1}
                  max={999}
                  value={maxUsesInput}
                  onChange={(event) =>
                    handleMaxUsesInputChange(event.target.value)
                  }
                  placeholder={t("maxUsesPlaceholder")}
                  className="h-full min-w-0 border-0 bg-transparent p-0 text-right text-sm font-semibold text-text-primary outline-none focus-visible:ring-0"
                />
                <span className="shrink-0 text-[11px] text-text-muted">
                  {t("maxUsesUnit")}
                </span>
              </label>

              <Button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={isCreatingInvite || isOverFreeMemberLimit}
                className={`h-11 rounded-content px-4 text-xs font-bold ${
                  isCreatingInvite || isOverFreeMemberLimit
                    ? "cursor-not-allowed border border-border bg-sub-background text-text-muted"
                    : "btn-dowin-primary"
                }`}
              >
                {isCreatingInvite ? t("creatingButton") : t("createButton")}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[1, 3, 5, 10].map((value) => (
                <Button
                  key={value}
                  type="button"
                  onClick={() => selectPresetMaxUses(value)}
                  className={`h-7 rounded-full px-2.5 text-[11px] font-bold ${
                    Number(maxUsesInput) === value
                      ? "border border-primary/20 bg-primary/10 text-primary"
                      : "border border-border bg-white text-text-muted"
                  }`}
                >
                  {t("presetUnit", { count: value })}
                </Button>
              ))}
            </div>

            {formError ? (
              <p className="text-[11px] text-danger">{formError}</p>
            ) : null}
            {isOverFreeMemberLimit ? (
              <p className="text-[11px] leading-relaxed text-danger">
                {isNativeApp
                  ? t("overLimitInviteDisabledApp")
                  : t("overLimitInviteDisabled")}
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4 rounded-content border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("inviteListTitle")}
            </h2>
            <p className="text-[11px] text-text-muted">{t("inviteListDesc")}</p>
          </div>

          <div className="overflow-hidden rounded-content border border-border">
            {invites.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-text-muted">
                {t("noInvites")}
              </div>
            ) : (
              invites.map((invite, index) => {
                const inviteId = invite.id ?? 0;
                const code = invite.code ?? "";
                const isActive = invite.status === "ACTIVE";
                const isPendingToggle = pendingToggleInviteId === inviteId;
                const isCopied = copiedInviteId === inviteId;
                const usageLabel = `${invite.usedCount ?? 0} / ${invite.maxUses ?? 0}`;
                const isActivationBlocked =
                  isOverFreeMemberLimit && !isActive;

                return (
                  <div
                    key={inviteId > 0 ? inviteId : `${code}-${index}`}
                    className={`space-y-3 bg-white px-4 py-3 ${
                      index < invites.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-mono text-sm font-bold tracking-wide text-text-primary">
                          {code || t("noCode")}
                        </p>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "border border-border bg-white text-text-secondary"
                          }`}
                        >
                          {isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => void copyInviteCode(inviteId, code)}
                          className="h-8 rounded-content border border-border bg-white px-2.5 text-[11px] font-bold text-text-primary"
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1.5">
                              <DowinIcon name="status-checkmark" size="14px" />{" "}
                              {t("copiedLabel")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <DowinIcon name="action-copy" size="14px" /> {t("copyCode")}
                            </span>
                          )}
                        </Button>

                        <button
                          type="button"
                          disabled={
                            inviteId <= 0 ||
                            isPendingToggle ||
                            isActivationBlocked
                          }
                          aria-label={isActive ? t("inactive") : t("active")}
                          onClick={() =>
                            void toggleInviteStatus(
                              inviteId,
                              isActive ? "INACTIVE" : "ACTIVE",
                            )
                          }
                          className={`relative inline-flex h-[22px] w-[42px] flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${
                            inviteId <= 0 || isPendingToggle
                              ? "cursor-not-allowed opacity-60"
                              : isActivationBlocked
                                ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          } ${isActive ? "bg-primary" : "bg-border"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ${
                              isActive ? "translate-x-[20px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
                      <span className="text-[10px] font-bold tracking-wide text-text-muted">
                        {t("usageLabel", { usage: usageLabel })}
                      </span>
                      {isActive && isOverFreeMemberLimit ? (
                        <span className="text-[10px] font-semibold text-danger">
                          {t("activeInviteOverLimit")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </ProtectedPageContainer>
    </div>
  );
}

function InvitePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-sub-background" />
        <div className="h-24 rounded-content bg-sub-background" />
        <div className="h-44 rounded-content bg-sub-background" />
        <div className="h-72 rounded-content bg-sub-background" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileInvites");
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-content border border-border p-6 text-center">
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
        </Card>
      </div>
    </div>
  );
}

function NoAccessState() {
  const t = useTranslations("ProfileInvites");
  const workspaceId = useParams().workspaceId as string | undefined;
  return (
    <div className="min-h-screen bg-background">
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
            <Link href={getWorkspacePath(workspaceId, "/profile")}>{t("backToSettings")}</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
