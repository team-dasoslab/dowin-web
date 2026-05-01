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
  AdminBillingWorkspaceSummary,
} from "@/api/generated/dowin.schemas";

export default function AdminBillingPageClient() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  // Manual Override Form States
  const [editPlanCode, setEditPlanCode] = useState<AdminBillingManualOverrideRequestPlanCode>("FREE");
  const [editBillingStatus, setEditBillingStatus] = useState<AdminBillingManualOverrideRequestBillingStatus>("NONE");
  const [editPeriodEnd, setEditPeriodEnd] = useState<string>("");
  const [editCancelAtEnd, setEditCancelAtEnd] = useState<boolean>(false);
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
      setEditPeriodEnd(d.currentPeriodEnd ? d.currentPeriodEnd.split("T")[0] : "");
      setEditCancelAtEnd(d.cancelAtPeriodEnd || false);
      setEditCustomerKey(d.customerKey || "");
      setEditSubscriptionKey(d.subscriptionKey || "");
    }
  }, [detailData]);

  const handleOpenOverride = (workspace: AdminBillingWorkspaceSummary) => {
    setSelectedWorkspaceId(workspace.workspaceId);
    setEditPlanCode(workspace.planCode || "FREE");
    setEditBillingStatus(workspace.billingStatus || "NONE");
    setEditPeriodEnd(workspace.currentPeriodEnd ? workspace.currentPeriodEnd.split("T")[0] : "");
    setEditCancelAtEnd(workspace.cancelAtPeriodEnd || false);
    setEditCustomerKey(workspace.customerKey || "");
    setEditSubscriptionKey(workspace.subscriptionKey || "");
    setChangeReason("워크스페이스 결제 정보 보정");
  };

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
          billingStatus: editBillingStatus,
          currentPeriodEnd: editPeriodEnd ? new Date(editPeriodEnd).toISOString() : null,
          cancelAtPeriodEnd: editCancelAtEnd,
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

  const detail = detailData?.data as AdminBillingWorkspaceSummary | undefined;

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
            className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
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
            className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
          />
        </div>
      </div>

      <div className="w-full">
        <Card className="bg-white border border-border rounded-content overflow-hidden">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              워크스페이스 결제 정보가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left">
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
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workspaces.map((ws: AdminBillingWorkspaceSummary) => (
                    <tr
                      key={ws.workspaceId}
                      className="hover:bg-sub-background/40 cursor-pointer transition-colors"
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
                        <span className="text-[12px] font-black px-2.5 py-1 border border-border bg-sub-background text-text-primary rounded-full uppercase tracking-wider block w-fit">
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
                                : "bg-sub-background text-text-secondary border-border"
                          }`}
                        >
                          {ws.billingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOverride(ws);
                          }}
                          className="px-3 py-1.5 border border-border bg-white text-[13px] font-black text-text-primary rounded-button transition-all"
                        >
                          상세 및 수정
                        </button>
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
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-content border border-border">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-content border border-border">
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
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold tracking-tight text-zinc-700 uppercase">
                결제 정보 수동 보정
              </h4>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                  >
                    <option value="FREE">FREE</option>
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
                    className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                  >
                    <option value="NONE">NONE</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CANCELED">CANCELED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="REVOKED">REVOKED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-600 ml-1">
                  이용 종료일 (Period End)
                </label>
                <Input
                  type="date"
                  value={editPeriodEnd}
                  onChange={(e) => setEditPeriodEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={editCancelAtEnd}
                  onChange={(e) => setEditCancelAtEnd(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  id="cancel-at-end-root"
                />
                <label
                  htmlFor="cancel-at-end-root"
                  className="text-[13px] font-bold text-text-primary select-none cursor-pointer"
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
                    className="w-full px-4 py-3 bg-zinc-100 border border-border rounded-button text-sm outline-none transition-all font-bold text-text-primary cursor-not-allowed select-all"
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
                    className="w-full px-4 py-3 bg-zinc-100 border border-border rounded-button text-sm outline-none transition-all font-bold text-text-primary cursor-not-allowed select-all"
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
                  className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
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
