"use client";

import { useGetAdminMarketingInviteCodes } from "@/api/generated/admin-marketing/admin-marketing";
import {
  MarketingInviteCodeStatus,
  MarketingInviteCodeSummary,
} from "@/api/generated/dowin.schemas";
import { useAdminPromotionsListActions } from "@/app/admin/(dashboard)/promotions/_hooks/useAdminPromotionsListActions";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminPromotionsPageClient() {
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // List Data
  const {
    data: listData,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useGetAdminMarketingInviteCodes();

  const { isPatching, handleUpdateListStatus, handleCopyCode } =
    useAdminPromotionsListActions(refetchList);

  const codes: MarketingInviteCodeSummary[] = Array.isArray(listData?.data)
    ? (listData.data as MarketingInviteCodeSummary[])
    : [];

  const filteredCodes = codes.filter((c) => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
            마케팅 프로모션 코드
          </h1>
          <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
            프로모션 코드(Basic)를 제공하는 프로모션 초대코드를 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-black bg-text-primary text-white rounded-button transition-all w-fit"
        >
          새 프로모션 코드 생성
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "ACTIVE", "INACTIVE", "EXPIRED"].map((s) => (
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
        ))}
      </div>

      <div className="w-full">
        <Card radius="xl" variant="white" shadow="none">
          {isListLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              생성된 프로모션 코드가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
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
                      Code Expires At
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredCodes.map((code) => (
                    <tr
                      key={code.id}
                      className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/admin/promotions/${code.id}`)
                      }
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
                            onClick={(e) => handleCopyCode(e, code.code)}
                            className="flex items-center gap-1 px-3 py-2 text-text-muted hover:text-text-primary transition-colors bg-zinc-50 rounded-[12px] border-none hover:bg-zinc-100 shadow-none"
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
                        <span className="text-[13px] font-bold text-text-primary">
                          {code.expiresAt
                            ? new Date(code.expiresAt).toLocaleDateString()
                            : "무제한"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-text-primary">
                          {code.entitlementDurationDays
                            ? `${code.entitlementDurationDays}일`
                            : "영구"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            role="switch"
                            aria-checked={code.status === "ACTIVE"}
                            disabled={isPatching}
                            onClick={(e) =>
                              handleUpdateListStatus(
                                e,
                                code.id,
                                code.status as MarketingInviteCodeStatus,
                              )
                            }
                            className={`relative inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none transition-colors duration-200 ease-in-out focus:outline-none ${
                              code.status === "ACTIVE"
                                ? "bg-primary"
                                : "bg-border"
                            } ${isPatching ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                code.status === "ACTIVE"
                                  ? "translate-x-[7px]"
                                  : "-translate-x-[7px]"
                              }`}
                            />
                          </Button>
                          <span
                            className={`text-[12px] font-black px-2 py-0.5 rounded-full border ${
                              code.status === "ACTIVE"
                                ? "bg-success/5 text-success border-success/10"
                                : "bg-zinc-100 text-zinc-600 border-none"
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
    </div>
  );
}
