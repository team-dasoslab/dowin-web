"use client";

import { useState, useEffect } from "react";
import {
  useGetAdminContactInquiries,
  useGetAdminContactInquiriesId,
  usePatchAdminContactInquiriesId,
} from "@/api/generated/admin-contact/admin-contact";
import {
  AdminContactInquiryUpdateRequestStatus,
  ContactInquirySummary,
  ContactInquiryDetail,
  GetAdminContactInquiriesStatus,
  GetAdminContactInquiriesCategory,
} from "@/api/generated/dowin.schemas";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import AdminModal from "@/app/admin/_components/AdminModal";

export default function AdminInquiriesPageClient() {
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Edit Modal States
  const [editStatus, setEditStatus] =
    useState<AdminContactInquiryUpdateRequestStatus>("RECEIVED");
  const [editAnswer, setEditAnswer] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("문의 확인 및 처리");

  const { showToast } = useToast();

  const {
    data: listData,
    isLoading: isListLoading,
    refetch,
  } = useGetAdminContactInquiries({
    status: status ? (status as GetAdminContactInquiriesStatus) : undefined,
    category: category ? (category as GetAdminContactInquiriesCategory) : undefined,
  });

  const { data: detailData, isLoading: isDetailLoading } =
    useGetAdminContactInquiriesId(selectedId as number, {
      query: {
        enabled: selectedId !== null,
      },
    });

  const patchMutation = usePatchAdminContactInquiriesId();

  useEffect(() => {
    if (detailData?.data) {
      const d = detailData.data as ContactInquiryDetail;
      setEditStatus(d.status || "RECEIVED");
      setEditAnswer(d.answerSummary || "");
      setChangeReason("문의 확인 및 처리");
    }
  }, [detailData]);

  const handleOpenEdit = (inquiry: ContactInquirySummary) => {
    setSelectedId(inquiry.id);
    setEditStatus(inquiry.status || "RECEIVED");
    setEditAnswer(inquiry.answerSummary || "");
    setChangeReason("문의 확인 및 처리");
  };

  const handleSave = async () => {
    if (!selectedId) return;
    if (!changeReason) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await patchMutation.mutateAsync({
        id: selectedId,
        data: {
          status: editStatus,
          answerSummary: editAnswer || null,
          changeReason,
        },
      });

      if (response.status === 200) {
        showToast("success", "문의 내역이 성공적으로 업데이트되었습니다.");
        setSelectedId(null);
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

  const inquiries: ContactInquirySummary[] = Array.isArray(listData?.data)
    ? (listData.data as ContactInquirySummary[])
    : [];

  const detail = detailData?.data as ContactInquiryDetail | undefined;

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
          문의 처리 센터
        </h1>
        <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
          고객 지원 문의 목록을 보고, 상태를 변경하거나 처리 요약을 기록하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            처리 상태
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
          >
            <option value="">전체 상태</option>
            <option value="RECEIVED">접수됨 (Received)</option>
            <option value="IN_PROGRESS">처리 중 (In Progress)</option>
            <option value="RESOLVED">해결됨 (Resolved)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            문의 카테고리
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
          >
            <option value="">전체 카테고리</option>
            <option value="GENERAL">일반 (General)</option>
            <option value="BILLING">결제 (Billing)</option>
            <option value="BUG_OR_ACCOUNT">계정/버그 (Bug or Account)</option>
          </select>
        </div>
      </div>

      <div className="w-full">
        <Card className="bg-white border border-border rounded-content overflow-hidden">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              등록된 문의 내역이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-sub-background/40">
                  <tr>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Ticket ID
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inquiries.map((inquiry: ContactInquirySummary) => (
                    <tr
                      key={inquiry.id}
                      className="cursor-pointer transition-colors"
                      onClick={() => handleOpenEdit(inquiry)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-black text-text-primary block">
                          #{inquiry.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-text-primary">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-black px-2.5 py-1 border border-border bg-sub-background text-text-primary rounded-full uppercase tracking-wider w-fit">
                          {inquiry.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-bold text-text-primary break-all line-clamp-1">
                          {inquiry.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[12px] font-black px-2.5 py-1 rounded-full border ${
                            inquiry.status === "RESOLVED"
                              ? "bg-success/5 text-success border-success/10"
                              : inquiry.status === "IN_PROGRESS"
                                ? "bg-warning/5 text-warning border-warning/10"
                                : "bg-sub-background text-text-secondary border-border"
                          }`}
                        >
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(inquiry);
                          }}
                          className="px-3 py-1.5 border border-border bg-white text-[13px] font-black text-text-primary rounded-button transition-all"
                        >
                          상세 및 수정
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <AdminModal
        isOpen={Boolean(selectedId && detailData?.data)}
        onClose={() => setSelectedId(null)}
        title="상세 내역 및 문의 처리"
        maxWidth="max-w-4xl"
      >
        {isDetailLoading ? (
          <div className="p-8 text-center">
            <InlineSpinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3.5 rounded-content border border-border">
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  사용자 ID
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.userId}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  워크스페이스 ID
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.workspaceId || "없음"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                제목
              </span>
              <span className="text-base font-extrabold text-zinc-900 leading-normal break-words">
                {detail?.subject}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                문의 내용
              </span>
              <div className="text-sm font-medium text-zinc-800 bg-zinc-50 p-4 rounded-content border border-border leading-relaxed break-words whitespace-pre-wrap">
                {detail?.message}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                답변 받을 이메일
              </span>
              <span className="text-sm font-bold text-zinc-900 break-all">
                {detail?.replyEmail}
              </span>
            </div>

            <div className="border-t border-border pt-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    상태 업데이트
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AdminContactInquiryUpdateRequestStatus)}
                    className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                  >
                    <option value="RECEIVED">접수됨 (Received)</option>
                    <option value="IN_PROGRESS">처리 중 (In Progress)</option>
                    <option value="RESOLVED">해결됨 (Resolved)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    변경 사유 <span className="text-red-500 font-black">*</span>
                  </label>
                  <Input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="상태 변경의 이유를 적어주세요..."
                    className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
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
                  className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary resize-none placeholder:text-text-muted min-h-[auto]"
                />
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={patchMutation.isPending}
                className="w-full py-3.5 bg-text-primary text-white font-black text-[13px] rounded-button transition-all flex items-center justify-center gap-2 mt-4"
              >
                {patchMutation.isPending ? (
                  <InlineSpinner />
                ) : (
                  <span>업데이트 적용</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
