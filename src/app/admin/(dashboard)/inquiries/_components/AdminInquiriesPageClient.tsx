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
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
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
  } = useGetAdminContactInquiries({});

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

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus !== "ALL" && inq.status !== filterStatus) return false;
    if (filterCategory !== "ALL" && inq.category !== filterCategory) return false;
    return true;
  });

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {["ALL", "RECEIVED", "IN_PROGRESS", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterStatus === s
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ALL"
                ? "전체 상태"
                : s === "RECEIVED"
                ? "접수됨"
                : s === "IN_PROGRESS"
                ? "처리 중"
                : "해결됨"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "GENERAL", "BILLING", "BUG_OR_ACCOUNT"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterCategory === c
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {c === "ALL"
                ? "전체 카테고리"
                : c === "GENERAL"
                ? "일반"
                : c === "BILLING"
                ? "결제"
                : "계정/버그"}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden">
        <div className="w-full">
        <div className="overflow-hidden">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              등록된 문의 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
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
                <tbody className="bg-white">
                  {filteredInquiries.map((inquiry: ContactInquirySummary) => (
                    <tr
                      key={inquiry.id}
                      onClick={() => handleOpenEdit(inquiry)}
                      className="cursor-pointer hover:bg-zinc-50/50 transition-colors"
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
                        <span className="text-[12px] font-black px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full uppercase tracking-wider w-fit">
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
                                : "bg-zinc-100 text-zinc-600 border-none"
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
                          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-[13px] font-bold text-primary rounded-[12px] transition-colors"
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
        </div>
      </div>
      </Card>

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
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-5 rounded-[24px] border-none">
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
              <div className="text-sm font-medium text-zinc-800 bg-zinc-50 p-5 rounded-[24px] border-none leading-relaxed break-words whitespace-pre-wrap">
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

            <div className="pt-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    상태 업데이트
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AdminContactInquiryUpdateRequestStatus)}
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
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
                  className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900 resize-none placeholder:text-zinc-400 min-h-[auto]"
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
