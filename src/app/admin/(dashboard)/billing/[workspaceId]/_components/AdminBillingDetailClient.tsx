"use client";

import { useState, useEffect } from "react";
import {
  useGetAdminBillingWorkspacesWorkspaceId,
  usePostAdminBillingWorkspacesWorkspaceIdManualOverride,
} from "@/api/generated/admin-billing/admin-billing";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";
import {
  AdminBillingManualOverrideRequestPlanCode,
  AdminBillingManualOverrideRequestBillingStatus,
  AdminBillingManualOverrideRequestEntitlementSource,
  AdminBillingWorkspaceSummary,
} from "@/api/generated/dowin.schemas";

type EditableEntitlementSource =
  | Exclude<AdminBillingManualOverrideRequestEntitlementSource, null>
  | "";

const FREE_BILLING_STATUSES: AdminBillingManualOverrideRequestBillingStatus[] = [
  "NONE",
  "EXPIRED",
  "REVOKED",
];

const STANDARD_BILLING_STATUSES: AdminBillingManualOverrideRequestBillingStatus[] = [
  "ACTIVE",
  "CANCELED",
];

const STANDARD_ENTITLEMENT_SOURCES: EditableEntitlementSource[] = [
  "MANUAL_GRANT",
  "PARTNER",
  "INTERNAL_TEST",
  "POLAR",
];

export default function AdminBillingDetailClient({ workspaceId }: { workspaceId: number }) {
  const { showToast } = useToast();

  const [editPlanCode, setEditPlanCode] = useState<AdminBillingManualOverrideRequestPlanCode>("FREE");
  const [editBillingStatus, setEditBillingStatus] = useState<AdminBillingManualOverrideRequestBillingStatus>("NONE");
  const [editEntitlementSource, setEditEntitlementSource] = useState<EditableEntitlementSource>("");
  const [editPeriodEnd, setEditPeriodEnd] = useState<string>("");
  const [editCancelAtEnd, setEditCancelAtEnd] = useState<boolean>(false);
  const [editSeatCount, setEditSeatCount] = useState<string>("");
  const [editCustomerKey, setEditCustomerKey] = useState<string>("");
  const [editSubscriptionKey, setEditSubscriptionKey] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("워크스페이스 결제 정보 보정");

  const { data: detailData, isLoading: isDetailLoading, refetch } = useGetAdminBillingWorkspacesWorkspaceId(
    workspaceId
  );

  const overrideMutation = usePostAdminBillingWorkspacesWorkspaceIdManualOverride();
  const detail = detailData?.data as AdminBillingWorkspaceSummary | undefined;

  useEffect(() => {
    if (detail) {
      setEditPlanCode(detail.planCode || "FREE");
      setEditBillingStatus(detail.billingStatus || "NONE");
      setEditEntitlementSource(
        normalizeEntitlementSource(
          detail.planCode || "FREE",
          detail.entitlementSource || "",
        ),
      );
      setEditPeriodEnd(detail.currentPeriodEnd ? detail.currentPeriodEnd.split("T")[0] : "");
      setEditCancelAtEnd(detail.cancelAtPeriodEnd || false);
      setEditSeatCount(detail.purchasedSeatCount !== null && detail.purchasedSeatCount !== undefined ? String(detail.purchasedSeatCount) : "");
      setEditCustomerKey(detail.customerKey || "");
      setEditSubscriptionKey(detail.subscriptionKey || "");
    }
  }, [detail]);

  const handleSaveOverride = async () => {
    if (!changeReason.trim()) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await overrideMutation.mutateAsync({
        workspaceId: workspaceId,
        data: {
          planCode: editPlanCode,
          billingStatus: editBillingStatus,
          entitlementSource: editEntitlementSource || null,
          currentPeriodEnd: editPeriodEnd ? new Date(editPeriodEnd).toISOString() : null,
          cancelAtPeriodEnd: editCancelAtEnd,
          purchasedSeatCount: editSeatCount ? Number(editSeatCount) : null,
          changeReason,
        },
      });

      if (response.status === 200) {
        showToast("success", "결제 정보가 보정되었습니다.");
        refetch();
      } else {
        showToast("error", "결제 정보 보정에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        "error",
        error?.response?.data?.message || error?.message || "결제 정보 보정에 실패했습니다."
      );
    }
  };

  const availableStatuses =
    editPlanCode === "BASIC" || editPlanCode === "STANDARD"
      ? STANDARD_BILLING_STATUSES
      : FREE_BILLING_STATUSES;
  const availableEntitlementSources: EditableEntitlementSource[] =
    editPlanCode === "BASIC" || editPlanCode === "STANDARD"
      ? STANDARD_ENTITLEMENT_SOURCES
      : ["", "POLAR"];

  return (
    <AdminFormLayout
      title="결제 상태 및 플랜 보정"
      description="워크스페이스의 결제 정보를 확인하고 필요시 수동으로 보정합니다."
      backHref="/admin/billing"
    >
      <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden p-6 sm:p-8 space-y-6">
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
                  워크스페이스 명
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.workspaceName}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  요금제 코드
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.planCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-50 p-5 rounded-[24px] border-none">
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  제공업체 (PG)
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.provider || "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  권한 출처
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.entitlementSource || "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  결제 상태
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.billingStatus}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  이용 종료일
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.currentPeriodEnd
                    ? new Date(detail.currentPeriodEnd).toLocaleString()
                    : "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-text-muted block mb-1">
                  멤버 한도 (Seats)
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {detail.purchasedSeatCount !== null && detail.purchasedSeatCount !== undefined
                    ? `${detail.purchasedSeatCount}명`
                    : "자동 (Auto)"}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-2 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold tracking-tight text-zinc-700 uppercase">
                결제 정보 수동 보정
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    보정 요금제
                  </label>
                  <select
                    value={editPlanCode}
                    onChange={(e) =>
                      setEditPlanCode(
                        e.target.value as AdminBillingManualOverrideRequestPlanCode
                      )
                    }
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    보정 상태
                  </label>
                  <select
                    value={editBillingStatus}
                    onChange={(e) =>
                      setEditBillingStatus(
                        e.target.value as AdminBillingManualOverrideRequestBillingStatus
                      )
                    }
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    권한 출처
                  </label>
                  <select
                    value={editEntitlementSource}
                    onChange={(e) =>
                      setEditEntitlementSource(
                        e.target.value as EditableEntitlementSource
                      )
                    }
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  >
                    {availableEntitlementSources.map((source) => (
                      <option key={source || "none"} value={source}>
                        {source || "없음 (None)"}
                      </option>
                    ))}
                  </select>
                  <p className="px-1 text-[11px] font-medium leading-relaxed text-text-muted">
                    {editPlanCode === "BASIC" || editPlanCode === "STANDARD"
                      ? "수동 권한 지급은 기본적으로 MANUAL_GRANT를 사용하세요. POLAR는 실제 결제 정합성 보정에만 사용합니다."
                      : "FREE 상태에서는 source를 비우거나 POLAR만 유지하세요."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    이용 종료일 (Period End)
                  </label>
                  <Input
                    type="date"
                    value={editPeriodEnd}
                    onChange={(e) => setEditPeriodEnd(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    멤버 한도 (Seats)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={editSeatCount}
                    onChange={(e) => setEditSeatCount(e.target.value)}
                    disabled={editPlanCode === "FREE"}
                    placeholder="지정 안 함 (자동 설정)"
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary disabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                  />
                  <p className="px-1 text-[11px] font-medium leading-relaxed text-text-muted mt-1">
                    빈 값이면 기존 값 유지 또는 현재 멤버 수 기준으로 자동 설정
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={editCancelAtEnd}
                  onChange={(e) => setEditCancelAtEnd(e.target.checked)}
                  disabled={editPlanCode === "FREE"}
                  className="rounded border-none bg-white text-primary focus:ring-primary h-4 w-4"
                  id="cancel-at-end-root"
                />
                <label
                  htmlFor="cancel-at-end-root"
                  className={`text-[13px] font-bold select-none ${
                    editPlanCode !== "FREE"
                      ? "text-text-primary cursor-pointer"
                      : "text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  종료 시 자동 해지
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    고객 키 (Customer Key)
                  </label>
                  <Input
                    type="text"
                    value={editCustomerKey}
                    readOnly
                    placeholder="없음 (None)"
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm outline-none transition-all font-bold text-text-muted cursor-not-allowed select-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 ml-1">
                    구독 키 (Subscription Key)
                  </label>
                  <Input
                    type="text"
                    value={editSubscriptionKey}
                    readOnly
                    placeholder="없음 (None)"
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm outline-none transition-all font-bold text-text-muted cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-600 ml-1">
                  변경 사유 <span className="text-danger font-black">*</span>
                </label>
                <Input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="수동 보정 사유를 적어주세요..."
                  className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveOverride}
                  disabled={overrideMutation.isPending}
                  className="px-8 py-3.5 bg-text-primary text-white font-black text-[14px] rounded-button transition-all flex items-center justify-center gap-2"
                >
                  {overrideMutation.isPending ? (
                    <InlineSpinner />
                  ) : (
                    <span>수동 보정 적용</span>
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

function normalizeEntitlementSource(
  planCode: AdminBillingManualOverrideRequestPlanCode,
  source: EditableEntitlementSource,
): EditableEntitlementSource {
  if (planCode === "BASIC" || planCode === "STANDARD") {
    if (STANDARD_ENTITLEMENT_SOURCES.includes(source)) {
      return source;
    }

    return "MANUAL_GRANT";
  }

  return source === "POLAR" ? "POLAR" : "";
}
