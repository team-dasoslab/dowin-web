import {
  usePatchAdminMarketingInviteCodesId,
  usePatchAdminMarketingInviteRedemptionsIdFeedback,
} from "@/api/generated/admin-marketing/admin-marketing";
import {
  MarketingInviteCodeStatus,
  MarketingInviteFeedbackStatus,
} from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";

export const useAdminPromotionDetailActions = (
  promotionId: number,
  detailStatus: MarketingInviteCodeStatus | undefined,
  refetchDetail: () => void,
) => {
  const { showToast } = useToast();

  const patchCodeMutation = usePatchAdminMarketingInviteCodesId();
  const patchFeedbackMutation =
    usePatchAdminMarketingInviteRedemptionsIdFeedback();

  const [editStatus, setEditStatus] =
    useState<MarketingInviteCodeStatus>("ACTIVE");
  const [operatorNote, setOperatorNote] = useState("");

  useEffect(() => {
    if (detailStatus) {
      setEditStatus(detailStatus);
    }
  }, [detailStatus]);

  const handleUpdateStatus = async (newStatus: MarketingInviteCodeStatus) => {
    setEditStatus(newStatus);
    try {
      const response = await patchCodeMutation.mutateAsync({
        id: promotionId,
        data: {
          status: newStatus,
        },
      });

      if (response.status === 200) {
        showToast("success", "프로모션 상태가 업데이트되었습니다.");
        refetchDetail();
      }
    } catch (err: unknown) {
      setEditStatus(detailStatus || "ACTIVE");
      const error = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        error?.response?.data?.message ||
          "상태 업데이트 중 오류가 발생했습니다.",
      );
    }
  };

  const handleUpdateFeedback = async (
    redemptionId: number,
    newStatus: MarketingInviteFeedbackStatus,
  ) => {
    try {
      const response = await patchFeedbackMutation.mutateAsync({
        id: redemptionId,
        data: {
          feedbackStatus: newStatus,
          operatorNote: operatorNote || undefined,
        },
      });

      if (response.status === 200) {
        showToast("success", "피드백 상태가 업데이트되었습니다.");
        setOperatorNote("");
        refetchDetail();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        error?.response?.data?.message ||
          "피드백 상태 업데이트 중 오류가 발생했습니다.",
      );
    }
  };

  return {
    editStatus,
    operatorNote,
    setOperatorNote,
    isPatchCodePending: patchCodeMutation.isPending,
    isPatchFeedbackPending: patchFeedbackMutation.isPending,
    handleUpdateStatus,
    handleUpdateFeedback,
  };
};
