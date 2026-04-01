"use client";

import { usePostWorkspaces } from "@/api/generated/workspace/workspace";
import { useRouter } from "next/navigation";

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
      onSuccess: () => {
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
