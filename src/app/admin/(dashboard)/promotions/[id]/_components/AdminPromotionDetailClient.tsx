"use client";

import { useGetAdminMarketingInviteCodesId } from "@/api/generated/admin-marketing/admin-marketing";
import {
  MarketingInviteCodeDetail,
  MarketingInviteCodeStatus,
  MarketingInviteFeedbackStatus,
  MarketingInviteRedemption,
} from "@/api/generated/dowin.schemas";
import { useAdminPromotionDetailActions } from "@/app/admin/(dashboard)/promotions/[id]/_hooks/useAdminPromotionDetailActions";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function AdminPromotionDetailClient({
  promotionId,
}: {
  promotionId: number;
}) {
  const {
    data: detailResponse,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetAdminMarketingInviteCodesId(promotionId);

  const detailData = detailResponse?.data as
    | MarketingInviteCodeDetail
    | undefined;

  const {
    editStatus,
    operatorNote,
    setOperatorNote,
    isPatchCodePending,
    isPatchFeedbackPending,
    handleUpdateStatus,
    handleUpdateFeedback,
  } = useAdminPromotionDetailActions(
    promotionId,
    detailData?.status as MarketingInviteCodeStatus | undefined,
    refetchDetail,
  );

  return (
    <AdminFormLayout
      title="프로모션 상세 및 내역"
      description="프로모션 코드 상세 정보와 사용 내역을 조회하고 피드백 상태를 관리합니다."
      backHref="/admin/promotions"
    >
      <Card
        className="space-y-6"
        radius="xl"
        padding="lg"
        variant="white"
        shadow="none"
      >
        {isDetailLoading ? (
          <div className="py-12 flex justify-center">
            <InlineSpinner />
          </div>
        ) : !detailData ? (
          <div className="py-12 text-center text-sm font-bold text-text-muted">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <>
            <div className="space-y-6 bg-zinc-50 p-6 rounded-[24px]">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      코드 만료 일시
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {detailData.expiresAt
                        ? new Date(detailData.expiresAt).toLocaleString()
                        : "무제한"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-text-muted block mb-1">
                      혜택 유지 기간
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {detailData.entitlementDurationDays
                        ? `${detailData.entitlementDurationDays}일`
                        : "영구"}
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

              <div className="pt-2 flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-[13px] font-black text-text-primary block">
                    프로모션 활성화
                  </label>
                  <span className="text-[11px] font-bold text-text-muted">
                    비활성화 시 코드 사용이 즉시 차단됩니다.
                  </span>
                </div>
                <Button
                  type="button"
                  role="switch"
                  aria-checked={editStatus === "ACTIVE"}
                  disabled={isPatchCodePending}
                  onClick={() => {
                    const newStatus =
                      editStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    handleUpdateStatus(newStatus);
                  }}
                  className={`relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none transition-colors duration-200 ease-in-out focus:outline-none ${
                    editStatus === "ACTIVE" ? "bg-primary" : "bg-border"
                  } ${isPatchCodePending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editStatus === "ACTIVE"
                        ? "translate-x-[9px]"
                        : "-translate-x-[9px]"
                    }`}
                  />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-text-primary">
                Redemptions (사용 내역)
              </h3>

              {!detailData.redemptions ||
              detailData.redemptions.length === 0 ? (
                <div className="py-6 text-center text-[12px] font-bold text-text-muted border border-dashed border-zinc-200 rounded-[24px]">
                  아직 사용 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto border-none rounded-[24px] bg-white">
                  <table className="min-w-full text-left">
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
                    <tbody className="bg-white">
                      {detailData.redemptions.map(
                        (r: MarketingInviteRedemption) => (
                          <tr key={r.id}>
                            <td className="px-4 py-3 text-xs font-black text-text-primary">
                              #{r.id}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-text-primary">
                              {r.workspaceId}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-text-secondary">
                              {new Date(r.redeemedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                                  r.feedbackStatus === "RECEIVED"
                                    ? "bg-success/5 text-success border-success/10"
                                    : "bg-zinc-100 text-zinc-600 border-none"
                                }`}
                              >
                                {r.feedbackStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 space-y-2 min-w-[200px]">
                              <select
                                value={r.feedbackStatus || "PENDING"}
                                onChange={(e) =>
                                  handleUpdateFeedback(
                                    r.id,
                                    e.target
                                      .value as MarketingInviteFeedbackStatus,
                                  )
                                }
                                className="w-full px-3 py-2 bg-zinc-100 border-none rounded-[12px] text-[12px] focus:ring-2 focus:ring-primary/20 outline-none font-bold text-text-primary"
                                disabled={isPatchFeedbackPending}
                              >
                                <option value="NOT_REQUESTED">미요청</option>
                                <option value="REQUESTED">요청됨</option>
                                <option value="RECEIVED">수신완료</option>
                                <option value="DROPPED">드롭됨</option>
                              </select>
                              <Input
                                type="text"
                                value={operatorNote}
                                onChange={(e) =>
                                  setOperatorNote(e.target.value)
                                }
                                placeholder="노트 작성..."
                                size="sm"
                                className="font-medium"
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    setOperatorNote(e.target.value);
                                    handleUpdateFeedback(
                                      r.id,
                                      r.feedbackStatus,
                                    );
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </AdminFormLayout>
  );
}
