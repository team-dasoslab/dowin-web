"use client";

import {
  getGetWorkspacesMeQueryKey,
  usePostWorkspacesJoinByInvite,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type UseJoinWorkspaceMutationParams = {
  onError: (message: string) => void;
};

export const useJoinWorkspaceMutation = ({
  onError,
}: UseJoinWorkspaceMutationParams) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { mutate: joinWorkspace, isPending } = usePostWorkspacesJoinByInvite({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetWorkspacesMeQueryKey(),
        });
        showToast("success", "워크스페이스에 참가했습니다.");
        router.push("/dashboard/my");
      },
      onError: (error) => {
        const message = getApiErrorMessage(
          error,
          "워크스페이스 참가 중 오류가 발생했습니다.",
        );
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
