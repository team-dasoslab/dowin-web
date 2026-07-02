"use client";

import { useState, useEffect } from "react";
import {
  useGetAdminContactInquiriesId,
  usePatchAdminContactInquiriesId,
} from "@/api/generated/admin-contact/admin-contact";
import {
  AdminContactInquiryUpdateRequestStatus,
  ContactInquiryDetail,
} from "@/api/generated/dowin.schemas";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";

export default function AdminInquiryDetailClient({ inquiryId }: { inquiryId: number }) {
  const { showToast } = useToast();

  const [editStatus, setEditStatus] = useState<AdminContactInquiryUpdateRequestStatus>("RECEIVED");
  const [editAnswer, setEditAnswer] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("문의 확인 및 처리");

  const { data: detailData, isLoading: isDetailLoading, refetch } =
    useGetAdminContactInquiriesId(inquiryId);

  const detail = detailData?.data as ContactInquiryDetail | undefined;

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
        refetch();
      } else {
        showToast("error", "문의 내역 업데이트에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        "error",
        error?.response?.data?.message ||
          error?.message ||
          "문의 내역 업데이트에 실패했습니다."
      );
    }
  };

  return (
    <AdminFormLayout
      title="상세 내역 및 문의 처리"
      description="고객 문의 상세 내용을 확인하고 상태 및 답변을 업데이트합니다."
      backHref="/admin/inquiries"
    >
      <Card className="space-y-6" radius="xl" padding="lg" variant="white" shadow="none">
        {isDetailLoading ? (
          <div className="py-12 flex justify-center">
            <InlineSpinner />
          </div>
        ) : !detail ? (
          <div className="py-12 text-center text-sm font-bold text-text-muted">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-5 rounded-[24px] border-none">
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  사용자 ID
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.userId}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  워크스페이스 ID
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.workspaceId || "없음"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                제목
              </span>
              <span className="text-base font-extrabold text-text-primary leading-normal break-words">
                {detail.subject}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                문의 내용
              </span>
              <div className="text-sm font-medium text-text-primary bg-zinc-50 p-5 rounded-[24px] border-none leading-relaxed break-words whitespace-pre-wrap">
                {detail.message}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                답변 받을 이메일
              </span>
              <span className="text-sm font-bold text-text-primary break-all">
                {detail.replyEmail}
              </span>
            </div>

            <div className="pt-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    상태 업데이트
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AdminContactInquiryUpdateRequestStatus)}
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  >
                    <option value="RECEIVED">접수됨 (Received)</option>
                    <option value="IN_PROGRESS">처리 중 (In Progress)</option>
                    <option value="RESOLVED">해결됨 (Resolved)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    변경 사유 <span className="text-danger font-black">*</span>
                  </label>
                  <Input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="상태 변경의 이유를 적어주세요..."
                    className="font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 ml-1">
                  답변 요약
                </label>
                <Textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  placeholder="문의 처리에 대한 요약을 적어주세요..."
                  rows={3}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={patchMutation.isPending}
                  variant="solid-dark"
                  size="primary"
                  className="gap-2"
                >
                  {patchMutation.isPending ? (
                    <InlineSpinner />
                  ) : (
                    <span>업데이트 적용</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </AdminFormLayout>
  );
}
