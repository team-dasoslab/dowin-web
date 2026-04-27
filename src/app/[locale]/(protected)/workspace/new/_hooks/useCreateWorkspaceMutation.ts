"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { getGetUsersMeQueryKey } from "@/api/generated/profile/profile";
import { getGetScoreboardsActiveQueryKey } from "@/api/generated/scoreboard/scoreboard";
import {
  getGetWorkspacesMeQueryKey,
  usePostWorkspaces,
} from "@/api/generated/workspace/workspace";
import { useRouter } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useQueryClient } from "@tanstack/react-query";

type WorkspaceCreateError = {
  data?: {
    message?: string;
  };
};

type UseCreateWorkspaceMutationParams = {
  onError: (message: string) => void;
};

export const useCreateWorkspaceMutation = ({
  onError,
}: UseCreateWorkspaceMutationParams) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createWorkspace, isPending } = usePostWorkspaces({
    mutation: {
      onSuccess: async (response) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getGetUsersMeQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetWorkspacesMeQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetScoreboardsActiveQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetDashboardTeamQueryKey(undefined),
          }),
        ]);
 
        const workspaceId =
          response.status === 201 ? response.data.id : undefined;
        trackEvent("workspace_created", {
          workspace_id_hash: hashId(workspaceId),
        });
 
        // Refresh server components to update layout state if needed
        router.refresh();
        router.push("/dashboard/my");
      },
      onError: (error: WorkspaceCreateError) => {
        onError(
          error.data?.message || "워크스페이스 생성 중 오류가 발생했습니다.",
        );
      },
    },
  });

  const submitCreateWorkspace = (name: string) => {
    createWorkspace({
      data: { name },
    });
  };

  return {
    isPending,
    submitCreateWorkspace,
  };
};
