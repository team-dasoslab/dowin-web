import { usePatchAdminContactInquiriesId } from "@/api/generated/admin-contact/admin-contact";
import {
  AdminContactInquiryUpdateRequestStatus,
  ContactInquiryDetail,
} from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";

export const useAdminInquiryDetailForm = (
  inquiryId: number,
  detail?: ContactInquiryDetail,
  refetch?: () => void,
) => {
  const { showToast } = useToast();

  const [editStatus, setEditStatus] =
    useState<AdminContactInquiryUpdateRequestStatus>("RECEIVED");
  const [editAnswer, setEditAnswer] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("문의 확인 및 처리");

  const patchMutation = usePatchAdminContactInquiriesId();

  useEffect(() => {
    if (detail) {
      setEditStatus(detail.status || "RECEIVED");
      setEditAnswer(detail.answerSummary || "");
      setChangeReason("문의 확인 및 처리");
    }
  }, [detail]);

  const handleSave = async () => {
    if (!changeReason) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await patchMutation.mutateAsync({
        id: inquiryId,
        data: {
          status: editStatus,
          answerSummary: editAnswer || null,
          changeReason,
        },
      });

      if (response.status === 200) {
        showToast("success", "문의 내역이 성공적으로 업데이트되었습니다.");
        refetch?.();
      } else {
        showToast("error", "문의 내역 업데이트에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        error?.response?.data?.message ||
          error?.message ||
          "문의 내역 업데이트에 실패했습니다.",
      );
    }
  };

  return {
    editStatus,
    setEditStatus,
    editAnswer,
    setEditAnswer,
    changeReason,
    setChangeReason,
    isPending: patchMutation.isPending,
    handleSave,
  };
};
