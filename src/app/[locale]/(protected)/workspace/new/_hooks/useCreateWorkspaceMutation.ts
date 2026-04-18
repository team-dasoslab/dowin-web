"use client";

import { usePostWorkspaces } from "@/api/generated/workspace/workspace";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useRouter } from "@/i18n/routing";

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

  const { mutate: createWorkspace, isPending } = usePostWorkspaces({
    mutation: {
      onSuccess: (response) => {
        const workspaceId = response.status === 201 ? response.data.id : undefined;
        trackEvent("workspace_created", {
          workspace_id_hash: hashId(workspaceId),
        });
        router.push("/dashboard/my");
      },
      onError: (error: WorkspaceCreateError) => {
        onError(error.data?.message || "워크스페이스 생성 중 오류가 발생했습니다.");
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
