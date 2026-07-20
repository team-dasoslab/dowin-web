import {
  getGetWorkspacesWorkspaceIdIntegrationsGithubQueryKey,
  useDeleteWorkspacesWorkspaceIdIntegrationsGithubRepositoriesRepositoryLinkId,
  useGetWorkspacesWorkspaceIdIntegrationsGithub,
  usePostWorkspacesWorkspaceIdIntegrationsGithubRepositories,
} from "@/api/generated/github-integration/github-integration";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export function useGithubIntegration() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const queryClient = useQueryClient();

  const { showToast } = useToast();
  const t = useTranslations("Integration");

  const queryKey = getGetWorkspacesWorkspaceIdIntegrationsGithubQueryKey(workspaceId);

  const { data, isLoading, error } = useGetWorkspacesWorkspaceIdIntegrationsGithub(workspaceId, {
    query: {
      staleTime: 0,
      retry: 1,
    },
  });

  const { mutateAsync: linkRepository, isPending: isLinking } =
    usePostWorkspacesWorkspaceIdIntegrationsGithubRepositories({
      mutation: {
        onSuccess: () => {
          showToast("success", t("connectionSuccess", { fallback: "저장소가 연결되었습니다." }));
          return queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => {
          showToast(
            "error",
            getApiErrorMessage(
              error,
              t("connectionFailed", { fallback: "저장소 연결에 실패했습니다." }),
            ),
          );
        },
      },
    });

  const { mutateAsync: unlinkRepository, isPending: isUnlinking } =
    useDeleteWorkspacesWorkspaceIdIntegrationsGithubRepositoriesRepositoryLinkId({
      mutation: {
        onSuccess: () => {
          showToast(
            "success",
            t("disconnectSuccess", { fallback: "저장소 연결이 해제되었습니다." }),
          );
          return queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => {
          showToast(
            "error",
            getApiErrorMessage(
              error,
              t("disconnectFailed", { fallback: "연결 해제에 실패했습니다." }),
            ),
          );
        },
      },
    });

  const handleLinkRepository = async (repositoryId: number) => {
    try {
      await linkRepository({ workspaceId, data: { repositoryId } });
    } catch {
      // Handled by onError in mutation
    }
  };

  const handleUnlinkRepository = async (repositoryLinkId: number) => {
    try {
      await unlinkRepository({ workspaceId, repositoryLinkId });
    } catch {
      // Handled by onError in mutation
    }
  };

  return {
    status: data?.data,
    isLoading,
    error,
    isLinking,
    isUnlinking,
    handleLinkRepository,
    handleUnlinkRepository,
  };
}
