"use client";

import { useState } from "react";
import {
  useGetAdminBillingWorkspaces,
  usePostAdminBillingWorkspacesSyncStatus,
} from "@/api/generated/admin-billing/admin-billing";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { AdminBillingWorkspaceSummary } from "@/api/generated/dowin.schemas";

export default function AdminBillingPageClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");

  // Frontend Filters
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { data: listData, isLoading: isListLoading, refetch } = useGetAdminBillingWorkspaces({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceName: workspaceName || undefined,
  });
  const syncStatusMutation = usePostAdminBillingWorkspacesSyncStatus();

  const workspaces: AdminBillingWorkspaceSummary[] = Array.isArray(listData?.data)
    ? (listData.data as AdminBillingWorkspaceSummary[])
    : [];

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (filterPlan !== "ALL" && ws.planCode !== filterPlan) return false;
    if (filterStatus !== "ALL" && ws.billingStatus !== filterStatus) return false;
    return true;
  });

  const handleSyncAllStatuses = async () => {
    try {
      const response = await syncStatusMutation.mutateAsync();

      if (response.status === 200) {
        showToast(
          "success",
          `현재 기준으로 ${response.data.syncedCount}개 워크스페이스의 billing 상태를 동기화했습니다.`,
        );
        refetch();
      } else {
        showToast("error", "billing 상태 전체 동기화에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        "error",
        error?.response?.data?.message || error?.message || "billing 상태 전체 동기화에 실패했습니다."
      );
    }
  };

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
            결제 지원 센터
          </h1>
          <p className="text-[14px] font-bold text-text-secondary">
            워크스페이스의 결제 정보와 활성화 상태를 확인하고 보정할 수 있습니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSyncAllStatuses}
          disabled={syncStatusMutation.isPending}
          className="h-11 shrink-0 rounded-[14px] bg-text-primary px-5 text-[13px] font-black text-white transition-all"
        >
          {syncStatusMutation.isPending ? (
            <InlineSpinner />
          ) : (
            <span>전체 상태 동기화</span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            요금제 (Plan)
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", "FREE", "BASIC", "STANDARD"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlan(p)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                  filterPlan === p
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {p === "ALL" ? "전체 요금제" : p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 mb-2 block">
            결제 상태 (Status)
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", "ACTIVE", "CANCELED", "NONE", "EXPIRED", "REVOKED"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                    filterStatus === s
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {s === "ALL" ? "전체 상태" : s}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <input
            type="number"
            min="1"
            placeholder="워크스페이스 ID 검색..."
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white border border-border/50 rounded-[16px] text-[14px] font-medium text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm placeholder:text-zinc-400"
          />
        </div>
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="워크스페이스 이름 검색..."
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white border border-border/50 rounded-[16px] text-[14px] font-medium text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm placeholder:text-zinc-400"
          />
        </div>
      </div>

      <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden">
        <div className="w-full">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              검색된 워크스페이스가 없습니다.
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
                      Status
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Seats
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredWorkspaces.map((ws: AdminBillingWorkspaceSummary) => (
                    <tr
                      key={ws.workspaceId}
                      onClick={() => router.push(`/admin/billing/${ws.workspaceId}`)}
                      className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-black text-text-primary block">
                          {ws.workspaceName}
                        </span>
                        <span className="text-[12px] font-bold text-text-muted mt-0.5 block">
                          ID: {ws.workspaceId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[12px] font-black px-2.5 py-1 rounded-full border ${
                            ws.planCode === "STANDARD"
                              ? "bg-primary/5 text-primary border-primary/10"
                              : ws.planCode === "BASIC"
                                ? "bg-blue-500/5 text-blue-600 border-blue-500/10"
                                : "bg-zinc-100 text-zinc-600 border-none"
                          }`}
                        >
                          {ws.planCode}
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
                        <span className="text-[14px] font-bold text-text-primary">
                          {ws.purchasedSeatCount !== null && ws.purchasedSeatCount !== undefined
                            ? `${ws.purchasedSeatCount}명`
                            : "Auto"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-black px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full uppercase tracking-wider w-fit">
                          {ws.entitlementSource || "None"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
