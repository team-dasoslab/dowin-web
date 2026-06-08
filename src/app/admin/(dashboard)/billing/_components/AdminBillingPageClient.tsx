"use client";

import { useState, useEffect } from "react";
import {
  useGetAdminBillingWorkspaces,
  useGetAdminBillingWorkspacesWorkspaceId,
  usePostAdminBillingWorkspacesWorkspaceIdManualOverride,
} from "@/api/generated/admin-billing/admin-billing";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import AdminModal from "@/app/admin/_components/AdminModal";
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

export default function AdminBillingPageClient() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  // Frontend Filters
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Manual Override Form States
  const [editPlanCode, setEditPlanCode] = useState<AdminBillingManualOverrideRequestPlanCode>("FREE");
  const [editBillingStatus, setEditBillingStatus] = useState<AdminBillingManualOverrideRequestBillingStatus>("NONE");
  const [editEntitlementSource, setEditEntitlementSource] = useState<EditableEntitlementSource>("");
  const [editPeriodEnd, setEditPeriodEnd] = useState<string>("");
  const [editCancelAtEnd, setEditCancelAtEnd] = useState<boolean>(false);
  const [editSeatCount, setEditSeatCount] = useState<string>("");
  const [editCustomerKey, setEditCustomerKey] = useState<string>("");
  const [editSubscriptionKey, setEditSubscriptionKey] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("워크스페이스 결제 정보 보정");

  const { showToast } = useToast();

  const { data: listData, isLoading: isListLoading, refetch } = useGetAdminBillingWorkspaces({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceName: workspaceName || undefined,
  });

  const { data: detailData, isLoading: isDetailLoading } = useGetAdminBillingWorkspacesWorkspaceId(
    selectedWorkspaceId as number,
    {
      query: {
        enabled: selectedWorkspaceId !== null,
      },
    }
  );

  const overrideMutation = usePostAdminBillingWorkspacesWorkspaceIdManualOverride();

  useEffect(() => {
    if (detailData?.data) {
      const d = detailData.data as AdminBillingWorkspaceSummary;
      setEditPlanCode(d.planCode || "FREE");
      setEditBillingStatus(d.billingStatus || "NONE");
      setEditEntitlementSource(
        normalizeEntitlementSource(
          d.planCode || "FREE",
          d.entitlementSource || "",
        ),
      );
      setEditPeriodEnd(d.currentPeriodEnd ? d.currentPeriodEnd.split("T")[0] : "");
      setEditCancelAtEnd(d.cancelAtPeriodEnd || false);
      setEditSeatCount(d.purchasedSeatCount !== null && d.purchasedSeatCount !== undefined ? String(d.purchasedSeatCount) : "");
      setEditCustomerKey(d.customerKey || "");
      setEditSubscriptionKey(d.subscriptionKey || "");
    }
  }, [detailData]);

  const handleOpenOverride = (workspace: AdminBillingWorkspaceSummary) => {
    setSelectedWorkspaceId(workspace.workspaceId);
    setEditPlanCode(workspace.planCode || "FREE");
    setEditBillingStatus(workspace.billingStatus || "NONE");
    setEditEntitlementSource(
      normalizeEntitlementSource(
        workspace.planCode || "FREE",
        workspace.entitlementSource || "",
      ),
    );
    setEditPeriodEnd(workspace.currentPeriodEnd ? workspace.currentPeriodEnd.split("T")[0] : "");
    setEditCancelAtEnd(workspace.cancelAtPeriodEnd || false);
    setEditSeatCount(workspace.purchasedSeatCount !== null && workspace.purchasedSeatCount !== undefined ? String(workspace.purchasedSeatCount) : "");
    setEditCustomerKey(workspace.customerKey || "");
    setEditSubscriptionKey(workspace.subscriptionKey || "");
    setChangeReason("워크스페이스 결제 정보 보정");
  };

  useEffect(() => {
    const nextStatusOptions =
      editPlanCode === "BASIC" || editPlanCode === "STANDARD"
        ? STANDARD_BILLING_STATUSES
        : FREE_BILLING_STATUSES;

    if (!nextStatusOptions.includes(editBillingStatus as AdminBillingManualOverrideRequestBillingStatus)) {
      setEditBillingStatus(nextStatusOptions[0] ?? "NONE");
    }

    const normalizedSource = normalizeEntitlementSource(
      editPlanCode,
      editEntitlementSource,
    );

    if (normalizedSource !== editEntitlementSource) {
      setEditEntitlementSource(normalizedSource);
    }

    if (editPlanCode === "FREE") {
      setEditCancelAtEnd(false);
      setEditSeatCount("");
    }
  }, [editPlanCode, editBillingStatus, editEntitlementSource]);

  const handleSaveOverride = async () => {
    if (!selectedWorkspaceId) return;
    if (!changeReason) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await overrideMutation.mutateAsync({
        workspaceId: selectedWorkspaceId,
        data: {
          planCode: editPlanCode,
          billingStatus: editBillingStatus as AdminBillingManualOverrideRequestBillingStatus,
          entitlementSource: editEntitlementSource || null,
          currentPeriodEnd: editPeriodEnd ? new Date(editPeriodEnd).toISOString() : null,
          cancelAtPeriodEnd: editCancelAtEnd,
          purchasedSeatCount: editSeatCount.trim() !== "" ? Number(editSeatCount) : null,
          customerKey: editCustomerKey || null,
          subscriptionKey: editSubscriptionKey || null,
          changeReason,
        },
      });

      if (response.status === 200) {
        showToast("success", "결제 정보가 성공적으로 보정되었습니다.");
        setSelectedWorkspaceId(null);
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

  const workspaces: AdminBillingWorkspaceSummary[] = Array.isArray(listData?.data)
    ? (listData.data as AdminBillingWorkspaceSummary[])
    : [];

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (filterPlan !== "ALL" && ws.planCode !== filterPlan) return false;
    if (filterStatus !== "ALL" && ws.billingStatus !== filterStatus) return false;
    return true;
  });

  const detail = detailData?.data as AdminBillingWorkspaceSummary | undefined;
  const availableStatuses =
    editPlanCode === "BASIC" || editPlanCode === "STANDARD"
      ? STANDARD_BILLING_STATUSES
      : FREE_BILLING_STATUSES;
  const availableEntitlementSources: EditableEntitlementSource[] =
    editPlanCode === "BASIC" || editPlanCode === "STANDARD"
      ? STANDARD_ENTITLEMENT_SOURCES
      : ["", "POLAR"];

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
          결제 지원 센터
        </h1>
        <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
          워크스페이스 목록을 조회하고, 직접 플랜이나 결제 상태 수동 보정 작업을 처리하세요.
        </p>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            Workspace ID
          </label>
          <Input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="ID로 검색하세요..."
            className="w-full px-4 py-3 bg-white shadow-sm border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
          />
        </div>
        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            Workspace Name
          </label>
          <Input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="이름으로 검색하세요..."
            className="w-full px-4 py-3 bg-white shadow-sm border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {["ALL", "FREE", "BASIC", "STANDARD"].map((plan) => (
            <button
              key={plan}
              onClick={() => setFilterPlan(plan)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterPlan === plan
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {plan === "ALL" ? "전체 플랜" : plan}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "NONE", "ACTIVE", "CANCELED", "EXPIRED", "REVOKED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterStatus === status
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {status === "ALL" ? "전체 상태" : status}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              워크스페이스 결제 정보가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-sub-background/40">
                  <tr>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Workspace
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Source
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {workspaces.map((ws: AdminBillingWorkspaceSummary) => (
                    <tr
                      key={ws.workspaceId}
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedWorkspaceId(ws.workspaceId)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-black text-text-primary block">
                          {ws.workspaceName}
                        </span>
                        <span className="text-[12px] font-bold text-text-muted">
                          ID: #{ws.workspaceId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-black px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full uppercase tracking-wider block w-fit">
                          {ws.planCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-text-primary">
                          {ws.provider || "없음 (None)"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[12px] font-black px-2.5 py-1 rounded-full border ${
                            ws.billingStatus === "ACTIVE"
                              ? "bg-success/5 text-success border-success/10"
                              : ws.billingStatus === "CANCELED"
                                ? "bg-warning/5 text-warning border-warning/10"
                                : "bg-zinc-100 text-zinc-600 border-none"
                          }`}
                        >
                          {ws.billingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-text-primary">
                          {ws.entitlementSource || "없음 (None)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOverride(ws);
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
        </Card>
      </div>

      <AdminModal
        isOpen={Boolean(selectedWorkspaceId && detailData?.data)}
        onClose={() => setSelectedWorkspaceId(null)}
        title="상세 내역 및 결제 정보 수정"
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
                  워크스페이스 명
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.workspaceName}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  요금제 코드
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.planCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-50 p-5 rounded-[24px] border-none">
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  제공업체 (PG)
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.provider || "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  권한 출처
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.entitlementSource || "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  결제 상태
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.billingStatus}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  이용 종료일
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.currentPeriodEnd
                    ? new Date(detail.currentPeriodEnd).toLocaleString()
                    : "없음 (None)"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-zinc-500 block mb-1">
                  멤버 한도 (Seats)
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {detail?.purchasedSeatCount !== null && detail?.purchasedSeatCount !== undefined
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
                  >
                    {availableEntitlementSources.map((source) => (
                      <option key={source || "none"} value={source}>
                        {source || "없음 (None)"}
                      </option>
                    ))}
                  </select>
                  <p className="px-1 text-[11px] font-medium leading-relaxed text-zinc-500">
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  />
                  <p className="px-1 text-[11px] font-medium leading-relaxed text-zinc-500 mt-1">
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm outline-none transition-all font-bold text-zinc-500 cursor-not-allowed select-all"
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
                    className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm outline-none transition-all font-bold text-zinc-500 cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-600 ml-1">
                  변경 사유 <span className="text-red-500 font-black">*</span>
                </label>
                <Input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="수동 보정 사유를 적어주세요..."
                  className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-zinc-900"
                  required
                />
              </div>

              <Button
                type="button"
                onClick={handleSaveOverride}
                disabled={overrideMutation.isPending}
                className="w-full py-3.5 bg-text-primary text-white font-black text-[13px] rounded-button transition-all flex items-center justify-center gap-2 mt-4"
              >
                {overrideMutation.isPending ? (
                  <InlineSpinner />
                ) : (
                  <span>수동 보정 적용</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
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
