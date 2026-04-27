"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { getGetUsersMeQueryKey } from "@/api/generated/profile/profile";
import { getGetScoreboardsActiveQueryKey } from "@/api/generated/scoreboard/scoreboard";
import {
  getGetWorkspacesMeQueryKey,
  usePostWorkspacesJoinByInvite,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type UseJoinWorkspaceMutationParams = {
  onError: (message: string) => void;
};

export const useJoinWorkspaceMutation = ({
  onError,
}: UseJoinWorkspaceMutationParams) => {
  const t = useTranslations("Workspace.join");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { mutate: joinWorkspace, isPending } = usePostWorkspacesJoinByInvite({
    mutation: {
      onSuccess: async () => {
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
 
        trackEvent("workspace_joined", {
          join_method: "invite_code",
          workspace_id_hash: hashId(undefined),
        });
        showToast("success", t("joinSuccess"));
 
        // Refresh server components to update layout state if needed
        router.refresh();
        router.push("/dashboard/my");
      },
      onError: (error) => {
        const message = getApiErrorMessage(error, t("joinFailed"));
        onError(message);
      },
    },
  });

  const submitJoinWorkspace = (code: string) => {
    joinWorkspace({
      data: {
        code,
      },
    });
  };

  return {
    isPending,
    submitJoinWorkspace,
  };
};
