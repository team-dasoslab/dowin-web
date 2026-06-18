"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, HelpCircle, CheckCircle2, X, FileEdit } from "lucide-react";
import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkspacesWorkspaceIdTeamCheckinsReport,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals,
  getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey
} from "@/api/generated/team-checkins/team-checkins";
import {
  TeamCheckinReportResponseAttentionItemsItem
} from "@/api/generated/dowin.schemas";

export function LeaderReport() {
  const t = useTranslations("TeamCheckin");

  const MOCK_TREND_POINTS = [
    { label: "5/18주", rate: 60, executionRate: 75 },
    { label: "5/25주", rate: 45, executionRate: 50 },
    { label: "6/1주", rate: 30, executionRate: 80 },
    { label: "6/8주", rate: 45, executionRate: 85 },
    { label: t("thisWeek"), rate: 70, executionRate: 83 },
  ];

  function formatDateRelative(dateString?: string | null) {
    if (!dateString) return t("justNow");
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return t("justNow");
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return t("daysAgo", { n: diffDays });
    if (diffHours > 0) return t("hoursAgo", { n: diffHours });
    if (diffMins > 0) return t("minsAgo", { n: diffMins });
    return t("justNow");
  }

  function formatDateRange(start?: string, end?: string) {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getMonth() + 1}.${s.getDate()} - ${e.getMonth() + 1}.${e.getDate()}`;
  }
  const { workspaceId } = useParams() as { workspaceId: string };
  const queryClient = useQueryClient();
  
  const { data: reportResponse } = useGetWorkspacesWorkspaceIdTeamCheckinsReport(workspaceId, { weekStart: "2026-06-15" });
  const submitProposal = usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals();

  const report = reportResponse?.status === 200 ? reportResponse.data : null;

  const [activeSignalModal, setActiveSignalModal] = useState<string | null>(null); // responseId
  const [commentText, setCommentText] = useState("");
  const [proposalType, setProposalType] = useState<'update_metric' | 'archive' | 'replace_action_item' | null>(null);
  const [proposalNumber, setProposalNumber] = useState<number | "">("");
  const [proposalReplacementText, setProposalReplacementText] = useState("");
  
  // Local state to eagerly hide resolved items to avoid layout jump waiting for query invalidate
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const closeModal = () => {
    setActiveSignalModal(null);
    setProposalType(null);
    setProposalNumber("");
    setProposalReplacementText("");
    setCommentText("");
  };

  const attentionItems = (report?.attentionItems || []).filter(item => item.responseId && !item.openProposalId && !resolvedIds.includes(item.responseId));
  const pendingCount = attentionItems.length;

  const handleResolveSignal = async (signal: TeamCheckinReportResponseAttentionItemsItem) => {
    if (!signal.responseId) return;
    
    let actionType: "CHANGE_TARGET_COUNT" | "ARCHIVE_ACTION_ITEM" | "REPLACE_ACTION_ITEM" | undefined;
    let payload: Record<string, unknown> = {};

    if (proposalType === 'archive') {
      actionType = "ARCHIVE_ACTION_ITEM";
      payload = { reason: commentText || "액션 아이템 보관 처리" };
    } else if (proposalType === 'update_metric' && proposalNumber !== "") {
      actionType = "CHANGE_TARGET_COUNT";
      payload = { newTargetValue: Number(proposalNumber) };
    } else if (proposalType === 'replace_action_item' && proposalReplacementText.trim() !== "") {
      actionType = "REPLACE_ACTION_ITEM";
      payload = { replacementName: proposalReplacementText };
    } else {
      // Just a comment, mapped as ARCHIVE for now or maybe we just don't allow comment-only in API
      // Since MVP requires an actionType, we will require at least one proposal type
      return;
    }

    try {
      await submitProposal.mutateAsync({
        workspaceId,
        data: {
          sourceResponseId: signal.responseId,
          actionType: actionType,
          payload: payload,
          leaderNote: commentText || null
        }
      });
      setResolvedIds(prev => [...prev, signal.responseId!]);
      queryClient.invalidateQueries({ queryKey: getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey(workspaceId) });
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-dowin-in max-w-5xl mx-auto pb-20 pt-4">
      
      {/* Week Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-2">
        <h2 className="text-[20px] font-bold text-text-primary tracking-tight mr-1">
          주간 리포트
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-[16px] bg-surface p-1.5 h-10">
            <div className="px-4 text-center text-[13px] font-black text-text-primary tabular-nums">
              {formatDateRange(report?.weekStart, report?.weekEnd) || t("thisWeek")}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <section id="achievement" className="scroll-mt-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">발송된 체크인</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.sentCount || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">건</span></div>
              <p className="text-[13px] text-text-muted mt-1">대상 {report?.summary?.recipientCount || 0}명</p>
            </div>
          </div>
          
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">1탭 반응률</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.oneTapResponseRate || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">%</span></div>
              <p className="text-[13px] text-text-muted mt-1">{report?.summary?.respondedCount || 0}명 응답</p>
            </div>
          </div>
          
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">기록 재개율</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.resumedWithin24hRate || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">%</span></div>
              <p className="text-[13px] text-text-muted mt-1">24시간 내 기록</p>
            </div>
          </div>
          
          <div className="bg-danger/5 rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-danger font-bold mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              확인 필요
            </span>
            <div>
              <div className="text-[32px] font-bold text-danger tracking-tight">{report?.summary?.adjustmentSignalCount || 0}<span className="text-[18px] text-danger/60 ml-1 font-medium">건</span></div>
              <p className="text-[13px] text-danger/70 mt-1">도움이 필요해요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Win Rate Trend Chart */}
      <div className="flex flex-col h-full px-2">
        <h3 className="text-[20px] font-bold text-text-primary mb-5 px-2">주간 달성률</h3>
        <div className="bg-surface rounded-[28px] p-6 w-full">
          <div className="flex items-center gap-8 mb-6 px-2">
            <div>
              <div className="relative group flex items-center gap-1.5 mb-1 w-max">
                <span className="text-[13px] font-bold text-text-muted">달성률</span>
                <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
              <div className="text-[28px] font-black tracking-tight text-text-primary">70<span className="text-[16px] text-text-muted ml-0.5">%</span></div>
            </div>
            
            <div>
              <div className="relative group flex items-center gap-1.5 mb-1 w-max">
                <span className="text-[13px] font-bold text-text-muted">실행률</span>
                <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
              <div className="text-[28px] font-black tracking-tight text-text-primary">83<span className="text-[16px] text-text-muted ml-0.5">%</span></div>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <WeeklyRateTrendChart points={MOCK_TREND_POINTS} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
        {/* Recent Activity Log */}
        <section id="history" className="flex flex-col h-full scroll-mt-28">
          <h3 className="text-[20px] font-bold text-text-primary mb-5 px-2">{t("checkinHistory")}</h3>
          
          <div className="bg-surface rounded-[28px] p-6 h-full">
            {(!report?.activity || report.activity.length === 0) ? (
              <div className="text-text-muted text-[15px] font-medium py-4">{t("noRecentActivity")}</div>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[31px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border/40">
                {report.activity.map((activity, i) => (
                  <div key={activity.checkinId! + i} className="relative flex items-start">
                    <div className={`absolute -left-6 flex items-center justify-center w-10 h-10 rounded-full z-10 transition-transform ${activity.type === 'CHECKIN_SENT' ? 'bg-primary' : 'bg-success'}`}>
                      {activity.type === 'CHECKIN_SENT' ? <Bot className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                    
                    <div className="ml-10 pt-1">
                      <p className="text-[15px] text-text-primary font-bold leading-snug tracking-tight mb-1">
                        {t("historyDesc", { nickname: activity.memberNickname || "", measureName: activity.leadMeasureName || "" })}
                      </p>
                      <p className="text-[13px] text-text-muted">
                        {formatDateRelative(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Attention Needed */}
        <section id="attention" className="flex flex-col h-full scroll-mt-28">
          <div className="flex items-center justify-between mb-5 px-2">
            <h3 className="text-[20px] font-bold text-text-primary">{t("attentionItems")}</h3>
            {pendingCount > 0 && (
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center transition-all">
                <span className="text-red-500 font-bold text-[16px]">{pendingCount}</span>
              </div>
            )}
          </div>
          
          <div className="bg-surface rounded-[28px] p-4 flex flex-col gap-2 h-full">
            <div className="space-y-1">
              {attentionItems.length === 0 ? (
                <div className="text-text-muted text-[15px] font-medium py-4">
                  {t("noAttentionItems")}
                </div>
              ) : attentionItems.map((signal) => (
                <div
                  key={signal.responseId!}
                  className={`w-full text-left py-3 px-2 rounded-[20px] transition-colors flex flex-col hover:bg-surface/40 cursor-pointer`}
                  onClick={() => setActiveSignalModal(signal.responseId!)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="relative shrink-0">
                      <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-[22px] bg-[#F2F4F6]`}>
                        {signal.signalType === 'BLOCKED' ? '🚨' : '🤔'}
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-red-500 rounded-full border-[2.5px] border-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[13px] font-bold text-[#4E5968]`}>
                          {signal.memberNickname}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-[#D1D6DB]" />
                        <span className={`text-[13px] font-bold ${signal.signalType === 'BLOCKED' ? 'text-red-500' : 'text-blue-500'}`}>
                          {signal.signalType === 'BLOCKED' ? '막힘 발생' : '목표 조정 필요'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-[#D1D6DB]" />
                        <span className="text-[13px] font-bold text-[#8B95A1]">{formatDateRelative(signal.createdAt)}</span>
                      </div>
                      
                      <p className={`text-[16px] truncate tracking-tight font-bold text-[#191F28] leading-snug`}>
                        {signal.leadMeasureName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Leader's Action Item Detail Modal */}
      {activeSignalModal && (() => {
        const signal = attentionItems.find(s => s.responseId === activeSignalModal);
        if (!signal) return null;
        
        const canSubmit = (proposalType === 'archive') || 
                          (proposalType === 'update_metric' && proposalNumber !== "") || 
                          (proposalType === 'replace_action_item' && proposalReplacementText.trim() !== "");

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200" onClick={closeModal}>
            <div className="bg-[#F2F4F6] w-full max-w-[480px] h-[85vh] max-h-[720px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-[0.98] duration-200" onClick={e => e.stopPropagation()}>
              
              <div className="px-6 py-5 flex items-start shrink-0 bg-white z-10 rounded-t-[32px] border-b border-[#F2F4F6] relative">
                <div className="flex gap-4 items-center w-full pr-8">
                  <div className="relative shrink-0">
                    <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-[22px] bg-[#F2F4F6]`}>
                      {signal.signalType === 'BLOCKED' ? '🚨' : '🤔'}
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-red-500 rounded-full border-[2.5px] border-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[18px] text-[#191F28] font-bold">
                          {signal.memberNickname}
                        </span>
                        <span className="text-[#B0B8C1] text-[12px] font-bold">•</span>
                        <span className={`text-[15px] font-bold ${signal.signalType === 'BLOCKED' ? 'text-red-500' : 'text-blue-500'}`}>
                          {signal.signalType === 'BLOCKED' ? '막힘 발생' : '목표 조정 필요'}
                        </span>
                      </div>
                      <span className="text-[14px] text-[#8B95A1] font-medium shrink-0">{formatDateRelative(signal.createdAt)}</span>
                    </div>
                    
                    <p className="text-[16px] text-[#4E5968] font-bold truncate leading-snug">
                      {signal.leadMeasureName}
                    </p>
                  </div>
                </div>

                <button onClick={closeModal} className="absolute top-5 right-5 p-2 hover:bg-[#F2F4F6] rounded-full transition-colors text-[#8B95A1] shrink-0">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
                <div className="px-2 space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[14px] font-bold text-[#4E5968]">{signal.memberNickname} 팀원의 요청</span>
                    </div>
                    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-2 mb-2">
                        <FileEdit className="w-4 h-4 text-[#8B95A1]" />
                        <span className="text-[14px] font-bold text-[#8B95A1]">{signal.signalType === 'BLOCKED' ? '막힘 발생 보고' : '목표 조율 요청'}</span>
                      </div>
                      <p className="text-[16px] text-[#333D4B] leading-relaxed">
                        {signal.note || "도움이 필요합니다."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-b-[32px]">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t("commentPlaceholder")}
                      className="flex-1 bg-[#F2F4F6] rounded-[16px] px-5 py-4 text-[16px] text-[#191F28] placeholder:text-[#8B95A1] outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSubmit && !submitProposal.isPending) {
                          handleResolveSignal(signal);
                        }
                      }}
                    />
                    <button 
                      disabled={!canSubmit || submitProposal.isPending}
                      onClick={() => handleResolveSignal(signal)}
                      className="px-6 py-4 bg-primary disabled:opacity-50 text-white text-[16px] font-bold rounded-[16px] hover:bg-primary/90 transition-all"
                    >
                      전송
                    </button>
                  </div>

                  <div className="bg-[#F2F4F6]/50 rounded-[16px] p-3.5 border border-border/30">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-[13px] font-bold text-[#8B95A1] shrink-0 px-1">액션 제안 (필수)</span>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            setProposalType(proposalType === 'update_metric' ? null : 'update_metric');
                            if (proposalType !== 'update_metric') setProposalNumber("");
                          }}
                          className={`px-4 py-2 rounded-[12px] text-[13px] font-bold transition-colors ${proposalType === 'update_metric' ? 'bg-primary text-white shadow-sm' : 'bg-white text-[#4E5968] border border-border/50 hover:bg-[#E5E8EB]'}`}
                        >
                          실행 횟수 조정
                        </button>
                        <button 
                          onClick={() => {
                            setProposalType(proposalType === 'archive' ? null : 'archive');
                          }}
                          className={`px-4 py-2 rounded-[12px] text-[13px] font-bold transition-colors ${proposalType === 'archive' ? 'bg-primary text-white shadow-sm' : 'bg-white text-[#4E5968] border border-border/50 hover:bg-[#E5E8EB]'}`}
                        >
                          아이템 보관
                        </button>
                        <button 
                          onClick={() => {
                            setProposalType(proposalType === 'replace_action_item' ? null : 'replace_action_item');
                            if (proposalType !== 'replace_action_item') setProposalReplacementText("");
                          }}
                          className={`px-4 py-2 rounded-[12px] text-[13px] font-bold transition-colors ${proposalType === 'replace_action_item' ? 'bg-primary text-white shadow-sm' : 'bg-white text-[#4E5968] border border-border/50 hover:bg-[#E5E8EB]'}`}
                        >
                          대체 목표 제안
                        </button>
                      </div>
                    </div>

                    {proposalType === 'update_metric' && (
                      <div className="mt-3.5 pt-3.5 border-t border-border/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 px-1">
                        <span className="text-[14px] text-[#333D4B] font-medium">실행 목표를</span>
                        <input 
                          type="number"
                          value={proposalNumber}
                          onChange={(e) => setProposalNumber(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder={t("proposeTargetLabel2")}
                          className="w-20 bg-white border border-primary/30 shadow-sm rounded-[10px] px-3 py-2 text-center text-[15px] font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          min={1}
                          autoFocus
                        />
                        <span className="text-[14px] text-[#333D4B] font-medium">회로 조정 제안</span>
                      </div>
                    )}

                    {proposalType === 'replace_action_item' && (
                      <div className="mt-3.5 pt-3.5 border-t border-border/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 px-1">
                        <input 
                          type="text"
                          value={proposalReplacementText}
                          onChange={(e) => setProposalReplacementText(e.target.value)}
                          placeholder={t("proposeReplacePlaceholder")}
                          className="flex-1 bg-white border border-primary/30 shadow-sm rounded-[10px] px-4 py-2.5 text-[15px] font-bold text-[#191F28] placeholder:text-[#8B95A1] placeholder:font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

function WeeklyRateTrendChart({ points }: { points: { label: string; rate: number; executionRate?: number }[] }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const data = points.map((p) => ({
    name: p.label,
    rate: p.rate,
    executionRate: p.executionRate,
  }));

  if (!isMounted) return null;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
      <ComposedChart data={data} margin={{ top: 25, right: 10, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3a64c7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3a64c7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#84cc16" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <Tooltip
          cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 2, strokeDasharray: "4 4" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-[12px] bg-zinc-800 px-3 py-1.5 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3a64c7" }} />
                  <p className="font-mono text-[12px] font-bold text-white/70">
                    달성률 <span className="text-white ml-1">{payload[0].value}%</span>
                  </p>
                </div>
                {payload[1] && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#84cc16" }} />
                    <p className="font-mono text-[12px] font-bold text-white/70">
                      실행률 <span className="text-white ml-1">{payload[1].value}%</span>
                    </p>
                  </div>
                )}
              </div>
            );
          }}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
          dy={8}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          ticks={[0, 50, 100]}
        />
        <Area
          type="monotone"
          dataKey="executionRate"
          stroke="#84cc16"
          strokeWidth={2}
          fill="url(#execGrad)"
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 4, fill: "#84cc16", stroke: "#fff", strokeWidth: 2 }}
          animationDuration={1000}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="#3a64c7"
          strokeWidth={2.5}
          fill="url(#winGrad)"
          activeDot={{ r: 5, fill: "#3a64c7", stroke: "#fff", strokeWidth: 2 }}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props;
            if (index === data.length - 1) {
              return (
                <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#3a64c7" stroke="#fff" strokeWidth={2} />
              );
            }
            return <svg key={`dot-${index}`} />;
          }}
          animationDuration={1000}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
