import { usePatchAdminMarketingInviteCodesId } from "@/api/generated/admin-marketing/admin-marketing";
import { MarketingInviteCodeStatus } from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";

export const useAdminPromotionsListActions = (refetchList: () => void) => {
  const { showToast } = useToast();
  const patchCodeMutation = usePatchAdminMarketingInviteCodesId();

  const handleUpdateListStatus = async (
    e: React.MouseEvent,
    codeId: number,
    currentStatus: MarketingInviteCodeStatus,
  ) => {
    e.stopPropagation();
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await patchCodeMutation.mutateAsync({
        id: codeId,
        data: {
          status: newStatus,
        },
      });

      if (response.status === 200) {
        showToast("success", "프로모션 상태가 업데이트되었습니다.");
        refetchList();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        error?.response?.data?.message ||
          "상태 업데이트 중 오류가 발생했습니다.",
      );
    }
  };

  const handleCopyCode = (e: React.MouseEvent, codeText: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText);
    showToast("success", "코드가 복사되었습니다.");
  };

  return {
    isPatching: patchCodeMutation.isPending,
    handleUpdateListStatus,
    handleCopyCode,
  };
};
