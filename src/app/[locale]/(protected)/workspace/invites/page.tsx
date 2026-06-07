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
import { useInviteActions } from "@/app/[locale]/(protected)/workspace/invites/_hooks/useInviteActions";
import { useInviteForm } from "@/app/[locale]/(protected)/workspace/invites/_hooks/useInviteForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNativeApp } from "@/context/NativeAppContext";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { useMemo, useState } from "react";
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

  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredInvites = useMemo(() => {
    return invites.filter((invite) => {
      if (filter === "ALL") return true;
      if (filter === "ACTIVE") return invite.status === "ACTIVE";
      if (filter === "INACTIVE") return invite.status !== "ACTIVE";
      return true;
    });
  }, [invites, filter]);

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
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer className="max-w-[640px]">
        <ProtectedPageHeader title={t("header")} />

        <div className="flex items-center gap-4 rounded-[24px] bg-white px-6 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
            <DowinIcon name="domain-ticket-diagonal" size="20px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[18px] font-black tracking-tight text-zinc-900">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-[13px] font-medium text-zinc-500">
              {t("invitesCountDesc", {
                total: invites.length,
                active: activeInviteCount,
              })}
            </p>
          </div>
        </div>

        {isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount}
          />
        ) : null}

        <div className="space-y-5 rounded-[24px] bg-white p-6">
          <div>
            <h2 className="text-[15px] font-black text-zinc-900">
              {t("newInviteTitle")}
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-zinc-600">
                {t("maxUsesLabel")}
              </p>
              <p className="text-[11px] font-medium text-zinc-400">{t("maxUsesLimit")}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-12 min-w-0 items-center gap-2 rounded-[16px] bg-zinc-50 px-4 text-xs font-bold text-zinc-600 transition-colors focus-within:bg-zinc-100">
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
                  className="h-full min-w-0 border-0 bg-transparent p-0 text-right text-sm font-semibold text-zinc-900 outline-none focus-visible:ring-0"
                />
                <span className="shrink-0 text-[11px] text-zinc-500">
                  {t("maxUsesUnit")}
                </span>
              </label>

              <Button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={isCreatingInvite || isOverFreeMemberLimit}
                className={`h-12 rounded-[16px] px-5 text-[14px] font-black transition-colors ${
                  isCreatingInvite || isOverFreeMemberLimit
                    ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
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
                  className={`h-8 rounded-full px-3 text-[12px] font-bold transition-colors ${
                    Number(maxUsesInput) === value
                      ? "bg-primary/10 text-primary"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
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
        </div>

        <div className="space-y-5 rounded-[24px] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-black text-zinc-900">
                {t("inviteListTitle")}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-3.5 py-1.5 text-[13px] font-bold tracking-tight text-zinc-600">
              <span>{activeInviteCount}</span>
              <span className="text-zinc-400">/ {invites.length}</span>
            </div>
          </div>

          <div className="flex gap-2 pb-2">
            <Button
              onClick={() => setFilter("ALL")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors min-h-0 ${
                filter === "ALL"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {t("filterAll")}
            </Button>
            <Button
              onClick={() => setFilter("ACTIVE")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors min-h-0 ${
                filter === "ACTIVE"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {t("filterActive")}
            </Button>
            <Button
              onClick={() => setFilter("INACTIVE")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors min-h-0 ${
                filter === "INACTIVE"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {t("filterInactive")}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {invites.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-zinc-500">
                {t("noInvites")}
              </div>
            ) : filteredInvites.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-zinc-500">
                선택한 필터에 해당하는 초대코드가 없습니다.
              </div>
            ) : (
              filteredInvites.map((invite, index) => {
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
                    className="flex flex-col gap-2 rounded-[16px] px-4 py-4 transition-colors hover:bg-zinc-50 -mx-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-mono text-sm font-bold tracking-wide text-zinc-900">
                          {code || t("noCode")}
                        </p>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => void copyInviteCode(inviteId, code)}
                          className="h-8 rounded-[12px] bg-zinc-100 px-3 text-[12px] font-bold text-zinc-700 hover:bg-zinc-200"
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

                        <Switch
                          disabled={
                            inviteId <= 0 ||
                            isPendingToggle ||
                            isActivationBlocked
                          }
                          checked={isActive}
                          onCheckedChange={() =>
                            void toggleInviteStatus(
                              inviteId,
                              isActive ? "INACTIVE" : "ACTIVE",
                            )
                          }
                          aria-label={isActive ? t("inactive") : t("active")}
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="text-[12px] font-medium text-zinc-500">
                        {t("usageLabel", { usage: usageLabel })}
                      </span>
                    </div>
                      {isActive && isOverFreeMemberLimit ? (
                        <span className="text-[10px] font-semibold text-danger">
                          {t("activeInviteOverLimit")}
                        </span>
                      ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function InvitePageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer isLoading className="max-w-[640px]">
        <div className="h-10 rounded-content bg-zinc-200" />
        <div className="h-24 rounded-content bg-zinc-200" />
        <div className="h-44 rounded-content bg-zinc-200" />
        <div className="h-72 rounded-content bg-zinc-200" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileInvites");
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-4 rounded-[24px] bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
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
  const t = useTranslations("ProfileInvites");
  const workspaceId = useParams().workspaceId as string | undefined;
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-4 rounded-[24px] bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
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
        </div>
      </div>
    </div>
  );
}
