"use client";

import {
  type GithubRepository,
  type WorkspaceGithubIntegrationStatus,
  type WorkspaceGithubRepositoryLink,
} from "@/api/generated/dowin.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { ProtectedPageContainer, ProtectedPageHeader } from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ActionRow } from "@/components/ui/ActionRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { isWorkspaceAdminRole } from "@/lib/client/workspace-role";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useGithubIntegration } from "./_hooks/useGithubIntegration";

export default function GithubIntegrationPageClient() {
  const t = useTranslations("Integration");
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const { data: workspaceResponse } = useGetWorkspacesMe();
  const workspace = workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const isWorkspaceAdmin = workspace ? isWorkspaceAdminRole(workspace) : false;

  const {
    status,
    isLoading,
    isLinking,
    isUnlinking,
    handleLinkRepository,
    handleUnlinkRepository,
  } = useGithubIntegration();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "connected") {
      showToast("success", t("connectionSuccess"));
      // remove param from URL without refreshing
      window.history.replaceState(null, "", window.location.pathname);
    } else if (statusParam === "failed") {
      showToast("error", t("connectionFailed"));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams, showToast, t]);

  const isPending = isLinking || isUnlinking;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <ProtectedPageContainer
          isLoading
          className="max-w-[640px] space-y-6 pb-24 md:pb-10 lg:pb-12"
        >
          <ProtectedPageHeader title={t("githubTitle")} />
          <div className="space-y-4">
            <div className="h-[88px] rounded-[24px] bg-border animate-pulse" />
            <div className="h-[120px] rounded-[24px] bg-border animate-pulse" />
          </div>
        </ProtectedPageContainer>
      </div>
    );
  }

  // If there's an error, typically it's handled globally, but we can show empty state or error state if needed
  const isSuccess =
    status && typeof status === "object" && !("code" in status) && !("detail" in status);
  const accountConnected = isSuccess
    ? (status as WorkspaceGithubIntegrationStatus).hasGithubAccountConnected
    : false;
  const availableRepositories = isSuccess
    ? (status as WorkspaceGithubIntegrationStatus).availableRepositories
    : [];
  const activeLinks = isSuccess ? (status as WorkspaceGithubIntegrationStatus).activeLinks : [];

  const linkedRepoIds = new Set(
    activeLinks.map((link: WorkspaceGithubRepositoryLink) => link.repositoryId),
  );

  return (
    <div className="min-h-screen">
      {isPending && (
        <LoadingOverlay
          message={
            isUnlinking
              ? t("disconnecting", { fallback: "연결 해제 중..." })
              : t("installing", { fallback: "연결 중..." })
          }
        />
      )}
      <ProtectedPageContainer className="max-w-[640px] space-y-6 pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader title={t("githubTitle")} />

        <div className="space-y-4">
          <div className="bg-surface rounded-[24px] p-5 md:p-6 text-sm text-text-muted">
            <h2 className="text-sm font-bold text-text-primary mb-2">
              {t("howToUse") ?? "사용 방법"}
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>{t("howToUseDesc1")}</li>
              <li>{t("howToUseDesc2")}</li>
            </ul>
          </div>

          <div className="space-y-4 rounded-[24px] bg-surface p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-text-primary">
                  {t("connectedRepos") ?? "연결 가능한 리포지토리"}
                </h2>
              </div>
              {accountConnected && (
                <div className="flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-bold tracking-tight bg-sub-background text-text-secondary">
                  <span>{availableRepositories.length}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!accountConnected ? (
                <div className="bg-sub-background rounded-[16px] px-4 py-10 text-center text-sm text-text-muted">
                  {t("connectFromProfile")}
                </div>
              ) : availableRepositories.length === 0 ? (
                <div className="bg-sub-background rounded-[16px] px-4 py-10 text-center text-sm text-text-muted">
                  {t("noRepos")}
                </div>
              ) : (
                availableRepositories.map((repo: GithubRepository) => {
                  const isLinked = linkedRepoIds.has(repo.id);
                  const linkRecord = activeLinks.find(
                    (link: WorkspaceGithubRepositoryLink) => link.repositoryId === repo.id,
                  );
                  const hasLinkedRepo = linkedRepoIds.size > 0;
                  const disableLink =
                    isPending || (hasLinkedRepo && !isLinked) || repo.isLinkedToOtherWorkspace;

                  return (
                    <ActionRow
                      key={repo.id}
                      title={repo.fullName}
                      description={
                        <>
                          <Badge variant={repo.private ? "danger" : "ghost-primary"} size="sm">
                            {repo.private ? "Private" : "Public"}
                          </Badge>
                          {repo.isLinkedToOtherWorkspace && (
                            <Badge variant="warning" size="sm">
                              {t("linkedToOtherWorkspace", { fallback: "다른 워크스페이스에 연결됨" })}
                            </Badge>
                          )}
                        </>
                      }
                      action={
                        isWorkspaceAdmin && (
                          isLinked ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleUnlinkRepository(linkRecord!.id)}
                              disabled={isPending}
                            >
                              {t("disconnect", { fallback: "연결 해제" })}
                            </Button>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                variant="solid-dark"
                                size="sm"
                                onClick={() => handleLinkRepository(repo.id)}
                                disabled={disableLink}
                                className="font-bold"
                              >
                                {t("connectAction", { fallback: "연결" })}
                              </Button>
                            </div>
                          )
                        )
                      }
                      className="rounded-[16px]"
                    />
                  );
                })
              )}
            </div>
          </div>

          {accountConnected && (
            <div className="bg-surface rounded-[24px] p-5 md:p-6 text-sm text-text-muted space-y-2">
              <p className="font-bold text-text-primary">{t("workspaceLinkDisclaimerTitle")}</p>
              <p>{t("workspaceLinkDisclaimerDesc")}</p>
            </div>
          )}
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
