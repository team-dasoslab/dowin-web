import { usePostWorkspacesIdMembersMemberIdNudge } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";

import { useParams } from "next/navigation";

export function useNudgeMember() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const t = useTranslations("Dashboard");
  const { showToast } = useToast();
  const nudgeMutation = usePostWorkspacesIdMembersMemberIdNudge();

  const nudgeMember = async (memberId: number, nickname: string) => {
    if (!workspaceId) return;
    try {
      await nudgeMutation.mutateAsync({ id: workspaceId, memberId });
      showToast("success", t("nudgeSuccess", { name: nickname }));
    } catch {
      showToast("error", t("nudgeFailed"));
    }
  };

  return {
    nudgeMember,
    isNudging: nudgeMutation.isPending,
  };
}
