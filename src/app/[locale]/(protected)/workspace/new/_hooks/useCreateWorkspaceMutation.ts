"use client";


import { getGetUsersMeQueryKey } from "@/api/generated/profile/profile";
import {
  getGetWorkspacesMeQueryKey,
  usePostWorkspaces,
} from "@/api/generated/workspace/workspace";
import { useRouter } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";

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
  const locale = useLocale();

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
            queryKey: ['workspaces'],
          }),
          queryClient.invalidateQueries({
            predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/dashboard/team'),
          }),
        ]);
 
        const workspaceId =
          response.status === 201 ? response.data.id : undefined;
        trackEvent("workspace_created", {
          workspace_id_hash: hashId(workspaceId),
        });
 
        if (workspaceId) {
          window.location.href = `/${locale}/${workspaceId}/dashboard/my`;
        } else {
          router.refresh();
          router.push("/");
        }
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
