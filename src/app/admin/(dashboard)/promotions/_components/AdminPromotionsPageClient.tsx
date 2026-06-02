"use client";

import { useEffect, useState } from "react";
import {
  useGetAdminMarketingInviteCodes,
  useGetAdminMarketingInviteCodesId,
  usePatchAdminMarketingInviteCodesId,
  usePatchAdminMarketingInviteRedemptionsIdFeedback,
} from "@/api/generated/admin-marketing/admin-marketing";
import {
  MarketingInviteCodeSummary,
  MarketingInviteCodeDetail,
  MarketingInviteCodeStatus,
  MarketingInviteFeedbackStatus,
  MarketingInviteRedemption,
} from "@/api/generated/dowin.schemas";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import AdminModal from "@/app/admin/_components/AdminModal";
import { Copy } from "lucide-react";

export default function AdminPromotionsPageClient() {
  const { showToast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // List Data
  const { data: listData, isLoading: isListLoading, refetch: refetchList } = useGetAdminMarketingInviteCodes();

  // Detail Data
  const {
    data: detailResponse,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetAdminMarketingInviteCodesId(selectedId as number, {
    query: {
      enabled: selectedId !== null,
    },
  });

  const detailData = detailResponse?.data as MarketingInviteCodeDetail | undefined;

  const patchCodeMutation = usePatchAdminMarketingInviteCodesId();
  const patchFeedbackMutation = usePatchAdminMarketingInviteRedemptionsIdFeedback();

  const [editStatus, setEditStatus] = useState<MarketingInviteCodeStatus>("ACTIVE");
  const [operatorNote, setOperatorNote] = useState("");

  useEffect(() => {
    if (detailData) {
      setEditStatus(detailData.status as MarketingInviteCodeStatus);
    }
  }, [detailData]);

  const handleUpdateStatus = async (newStatus: MarketingInviteCodeStatus) => {
    if (!selectedId) return;
    setEditStatus(newStatus);
    try {
      const response = await patchCodeMutation.mutateAsync({
        id: selectedId,
        data: {
          status: newStatus,
        },
      });

      if (response.status === 200) {
        showToast("success", "프로모션 상태가 업데이트되었습니다.");
        refetchDetail();
        refetchList();
      }
    } catch (err: unknown) {
      setEditStatus(detailData?.status as MarketingInviteCodeStatus);
      const error = err as { response?: { data?: { message?: string } } };
      showToast("error", error?.response?.data?.message || "상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateListStatus = async (e: React.MouseEvent, codeId: number, currentStatus: MarketingInviteCodeStatus) => {
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
        if (selectedId === codeId) {
          refetchDetail();
          setEditStatus(newStatus);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast("error", error?.response?.data?.message || "상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleCopyCode = (e: React.MouseEvent, codeText: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText);
    showToast("success", "코드가 복사되었습니다.");
  };

  const handleUpdateFeedback = async (redemptionId: number, newStatus: MarketingInviteFeedbackStatus) => {
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
      showToast("error", error?.response?.data?.message || "피드백 상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const codes: MarketingInviteCodeSummary[] = Array.isArray(listData?.data)
    ? (listData.data as MarketingInviteCodeSummary[])
    : [];

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
            마케팅 프로모션 코드
          </h1>
          <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
            영구 무료 혜택(Basic)을 제공하는 프로모션 초대코드를 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-black bg-text-primary text-white rounded-button transition-all w-fit"
        >
          새 프로모션 코드 생성
        </Link>
      </div>

      <div className="w-full">
        <Card className="bg-white border border-border rounded-content overflow-hidden">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : codes.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              생성된 프로모션 코드가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-sub-background/40">
                  <tr>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      ID
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Campaign
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Code
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Usage (Used / Max)
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {codes.map((code) => (
                    <tr
                      key={code.id}
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedId(code.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-black text-text-primary block">
                          #{code.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-text-primary block">
                          {code.campaignName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-text-primary block">
                            {code.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(e, code.code)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-text-muted hover:text-text-primary transition-colors bg-white rounded-button border border-border hover:bg-zinc-50 shadow-sm"
                            title="코드 복사"
                          >
                            <Copy size={14} strokeWidth={2.5} />
                            <span className="text-[12px] font-bold">복사</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-text-primary">
                          {code.usedCount} / {code.maxUses}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={code.status === "ACTIVE"}
                            disabled={patchCodeMutation.isPending}
                            onClick={(e) => handleUpdateListStatus(e, code.id, code.status as MarketingInviteCodeStatus)}
                            className={`relative inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              code.status === "ACTIVE" ? "bg-primary" : "bg-zinc-200"
                            } ${patchCodeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                code.status === "ACTIVE" ? "translate-x-[7px]" : "-translate-x-[7px]"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[12px] font-black px-2 py-0.5 rounded-full border ${
                              code.status === "ACTIVE"
                                ? "bg-success/5 text-success border-success/10"
                                : "bg-sub-background text-text-secondary border-border"
                            }`}
                          >
                            {code.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-bold text-text-secondary">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </span>
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
        isOpen={Boolean(selectedId && detailData)}
        onClose={() => setSelectedId(null)}
        title="프로모션 상세 및 내역"
        maxWidth="max-w-4xl"
      >
        {isDetailLoading ? (
          <div className="p-8 text-center">
            <InlineSpinner />
          </div>
        ) : !detailData ? (
          <div className="p-8 text-center text-sm font-bold text-zinc-500">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-6 bg-zinc-50 p-5 rounded-content border border-border">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  기본 정보
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      ID
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      #{detailData.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      캠페인 이름
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {detailData.campaignName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      코드
                    </span>
                    <span className="text-sm font-bold text-text-primary break-all">
                      {detailData.code}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      부여 좌석 수
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {detailData.grantedSeatCount} Seats
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      사용 횟수
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {detailData.usedCount} / {detailData.maxUses}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-black text-text-muted block mb-1">
                    설명
                  </span>
                  <span className="text-xs font-medium text-text-secondary break-words">
                    {detailData.description || "설명 없음"}
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-border/70 flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-[13px] font-black text-text-primary block">
                    프로모션 활성화
                  </label>
                  <span className="text-[11px] font-bold text-text-muted">
                    비활성화 시 코드 사용이 즉시 차단됩니다.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editStatus === "ACTIVE"}
                  disabled={patchCodeMutation.isPending}
                  onClick={() => {
                    const newStatus = editStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    handleUpdateStatus(newStatus);
                  }}
                  className={`relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editStatus === "ACTIVE" ? "bg-primary" : "bg-zinc-200"
                  } ${patchCodeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editStatus === "ACTIVE" ? "translate-x-[9px]" : "-translate-x-[9px]"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-text-primary">Redemptions (사용 내역)</h3>
              
              {(!detailData.redemptions || detailData.redemptions.length === 0) ? (
                <div className="py-6 text-center text-[12px] font-bold text-text-muted border border-dashed border-border rounded-content">
                  아직 사용 내역이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-border overflow-x-auto border border-border rounded-content">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-black tracking-wider text-text-muted uppercase">
                          ID
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black tracking-wider text-text-muted uppercase">
                          Workspace
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black tracking-wider text-text-muted uppercase">
                          Redeemed At
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black tracking-wider text-text-muted uppercase">
                          Feedback Status
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black tracking-wider text-text-muted uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {detailData.redemptions.map((redemption: MarketingInviteRedemption) => (
                        <tr key={redemption.id}>
                          <td className="px-4 py-3 text-xs font-black text-text-primary">
                            #{redemption.id}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-text-primary">
                            {redemption.workspaceId}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-text-secondary">
                            {new Date(redemption.redeemedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                                redemption.feedbackStatus === "RECEIVED"
                                  ? "bg-success/5 text-success border-success/10"
                                  : "bg-sub-background text-text-secondary border-border"
                              }`}
                            >
                              {redemption.feedbackStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-y-2 min-w-[200px]">
                            <select
                              onChange={(e) => handleUpdateFeedback(redemption.id, e.target.value as MarketingInviteFeedbackStatus)}
                              value={redemption.feedbackStatus}
                              className="w-full px-2 py-1.5 bg-zinc-50 border border-border rounded-button text-[11px] focus:border-primary outline-none font-bold text-text-primary"
                              disabled={patchFeedbackMutation.isPending}
                            >
                              <option value="NOT_REQUESTED">미요청</option>
                              <option value="REQUESTED">요청됨</option>
                              <option value="RECEIVED">수신완료</option>
                              <option value="DROPPED">드롭됨</option>
                            </select>
                            <Input
                              type="text"
                              placeholder="메모 후 블러 시 자동 저장"
                              className="w-full px-2 py-1.5 bg-white border border-border rounded-button text-[11px] focus:border-primary outline-none font-medium text-text-primary"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  setOperatorNote(e.target.value);
                                  handleUpdateFeedback(redemption.id, redemption.feedbackStatus);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
