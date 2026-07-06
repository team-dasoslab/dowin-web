"use client";

import { useState } from "react";
import {
  useGetAdminContactInquiries,
} from "@/api/generated/admin-contact/admin-contact";
import {
  ContactInquirySummary,
} from "@/api/generated/dowin.schemas";
import { Badge } from "@/components/ui/Badge";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";

export default function AdminInquiriesPageClient() {
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const {
    data: listData,
    isLoading: isListLoading,
  } = useGetAdminContactInquiries({});

  const inquiries: ContactInquirySummary[] = Array.isArray(listData?.data)
    ? (listData.data as ContactInquirySummary[])
    : [];

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus !== "ALL" && inq.status !== filterStatus) return false;
    if (filterCategory !== "ALL" && inq.category !== filterCategory) return false;
    return true;
  });


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

      <Card radius="xl" variant="white" shadow="none">
        <div className="w-full overflow-hidden">
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
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredInquiries.map((inquiry: ContactInquirySummary) => (
                    <tr
                      key={inquiry.id}
                      onClick={() => router.push(`/admin/inquiries/${inquiry.id}`)}
                      className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
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
                        <Badge variant="default" shape="pill" className="w-fit uppercase tracking-wider">
                          {inquiry.category}
                        </Badge>
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
