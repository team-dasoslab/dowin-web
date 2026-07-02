"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, HelpCircle, CheckCircle2, X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGetWorkspacesWorkspaceIdReportsTeamTrend } from "@/api/generated/reports/reports";
import {
  addDays,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { TeamPeriodControls } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/TeamPeriodControls";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  useGetWorkspacesWorkspaceIdTeamCheckinsReport,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals,
  getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey
} from "@/api/generated/team-checkins/team-checkins";
import {
  TeamCheckinReportResponseAttentionItemsItem
} from "@/api/generated/dowin.schemas";
import { buildAdjustmentProposalDraft } from "../_lib/team-checkin-proposal";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

export function LeaderReport() {
  const t = useTranslations("TeamCheckin");

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

  const { workspaceId } = useParams() as { workspaceId: string };
  const queryClient = useQueryClient();
  
  const today = getTodayInKst();
  const [selectedDate, setSelectedDateState] = useState(today);
  const selectedWeekStart = getWeekDates(selectedDate)[0] ?? today;
  const currentWeekStart = getWeekDates(today)[0] ?? today;

  const movePeriod = (direction: -1 | 1) => {
    const nextWeekStart = addDays(selectedWeekStart, direction * 7);
    setSelectedDateState(nextWeekStart);
  };
  
  const setSelectedDate = (value: string) => {
    if (!isValidDateString(value)) return;
    const nextWeekStart = getWeekDates(value)[0] ?? value;
    setSelectedDateState(nextWeekStart);
  };
  
  const resetToToday = () => {
    setSelectedDateState(today);
  };

  const getWeekDatesFromStart = (weekStart?: string) => {
    if (!weekStart) return [];
    const [year, month, day] = weekStart.split("-").map(Number);
    const base = new Date(Date.UTC(year, month - 1, day));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setUTCDate(base.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
  };

  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const { data: reportResponse, isFetching: isPeriodLoading } = useGetWorkspacesWorkspaceIdTeamCheckinsReport(workspaceId, { weekStart: selectedWeekStart, activeOnly: showActiveOnly });
  const { data: trendResponse, isFetching: isTrendLoading } = useGetWorkspacesWorkspaceIdReportsTeamTrend(workspaceId, { weekStart: selectedWeekStart, weeks: 5 });
  const submitProposal = usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals();

  const report = reportResponse?.status === 200 ? reportResponse.data : null;
  const rawTrends = trendResponse?.status === 200 ? trendResponse.data.trends : [];

  const weekDates = getWeekDatesFromStart(report?.weekStart ?? selectedWeekStart);
  const weekLabel = weekDates.length === 7 
    ? `${weekDates[0].slice(5).replace("-", ".")} - ${weekDates[6].slice(5).replace("-", ".")}`
    : "";



  const [activeSignalModal, setActiveSignalModal] = useState<string | null>(null); // responseId
  const [commentText, setCommentText] = useState("");
  const [proposalType, setProposalType] = useState<'update_metric' | 'archive' | 'replace_action_item' | null>(null);
  const [proposalNumber, setProposalNumber] = useState<number | "">("");
  const [proposalReplacementText, setProposalReplacementText] = useState("");
  
  const closeModal = () => {
    setActiveSignalModal(null);
    setProposalType(null);
    setProposalNumber("");
    setProposalReplacementText("");
    setCommentText("");
  };

  const [attentionFilter, setAttentionFilter] = useState<'ALL' | 'REQUESTED' | 'ADJUSTING' | 'RESOLVED'>('ALL');

  const attentionItems = (report?.attentionItems || [])
    .filter(item => item.responseId)
    .filter(item => {
      if (attentionFilter === 'ALL') return true;
      
      const isRequested = !item.isResolved;
      const isAdjusting = item.isResolved && item.resolvedProposal?.status === 'PROPOSED';
      const isResolved = item.isResolved && (item.resolvedProposal?.status === 'ACCEPTED' || item.resolvedProposal?.status === 'DECLINED');
      
      if (attentionFilter === 'REQUESTED') return isRequested;
      if (attentionFilter === 'ADJUSTING') return isAdjusting;
      if (attentionFilter === 'RESOLVED') return isResolved;
      return true;
    });

  const activityLog = (report?.activity || []);

  const trendPoints = [...(rawTrends || [])]
    .sort((a, b) => (a.weekStart || "").localeCompare(b.weekStart || ""))
    .map(trend => {
      const s = new Date(trend.weekStart!);
      const isSelected = trend.weekStart === selectedWeekStart;
      return {
        label: isSelected ? t("thisWeek") : `${s.getMonth() + 1}.${s.getDate()}`,
        rate: trend.winRate || 0,
        executionRate: trend.executionRate || 0,
      };
    });

  const currentTrend = rawTrends?.find(t => t.weekStart === selectedWeekStart);
  const currentWinRate = currentTrend?.winRate || 0;
  const currentExecutionRate = currentTrend?.executionRate || 0;

  const handleResolveSignal = async (signal: TeamCheckinReportResponseAttentionItemsItem) => {
    if (!signal.responseId) return;
    
    const proposalDraft = buildAdjustmentProposalDraft({
      proposalType,
      proposalNumber,
      proposalReplacementText,
    });
    if (!proposalDraft) return;

    try {
      await submitProposal.mutateAsync({
        workspaceId,
        data: {
          sourceResponseId: signal.responseId,
          actionType: proposalDraft.actionType,
          payload: proposalDraft.payload,
          leaderNote: commentText || null
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey(workspaceId) });
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-dowin-in max-w-5xl mx-auto pb-20 pt-4">
      
      {/* Week Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <TeamPeriodControls
          isPeriodLoading={isPeriodLoading || isTrendLoading}
          isPreviousDisabled={false}
          isResetVisible={selectedWeekStart !== currentWeekStart}
          movePeriod={movePeriod}
          resetToToday={resetToToday}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          weekLabel={weekLabel}
        />
        <label className="flex items-center gap-2 cursor-pointer bg-surface px-3 py-2 rounded-[14px] shrink-0 border border-border/40 hover:bg-surface/80 transition-colors">
          <Checkbox 
            checked={showActiveOnly} 
            onChange={e => setShowActiveOnly(e.target.checked)}
          />
          <span className="text-[13px] font-bold text-text-secondary select-none">{t("activeMembersOnly")}</span>
        </label>
      </div>

      {/* Summary Stats */}
      <section id="achievement" className="scroll-mt-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">{t("sentCount")}</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.sentCount || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">{t("countUnit")}</span></div>
              <p className="text-[13px] text-text-muted mt-1">{t("targetCount", { n: report?.summary?.recipientCount || 0 })}</p>
            </div>
          </div>
          
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">{t("oneTapResponseRate")}</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.oneTapResponseRate || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">%</span></div>
              <p className="text-[13px] text-text-muted mt-1">{t("respondedCount", { n: report?.summary?.respondedCount || 0 })}</p>
            </div>
          </div>
          
          <div className="bg-surface rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-text-secondary font-medium mb-4">{t("resumedRate")}</span>
            <div>
              <div className="text-[32px] font-bold text-text-primary tracking-tight">{report?.summary?.resumedWithin24hRate || 0}<span className="text-[18px] text-text-muted ml-1 font-medium">%</span></div>
              <p className="text-[13px] text-text-muted mt-1">{t("resumedWithin24h")}</p>
            </div>
          </div>
          
          <div className="bg-danger/5 rounded-[24px] p-6 flex flex-col justify-between">
            <span className="text-[14px] text-danger font-bold mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              {t("needsCheck")}
            </span>
            <div>
              <div className="text-[32px] font-bold text-danger tracking-tight">{report?.summary?.adjustmentSignalCount || 0}<span className="text-[18px] text-danger/60 ml-1 font-medium">{t("countUnit")}</span></div>
              <p className="text-[13px] text-danger/70 mt-1">{t("needsHelp")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Win Rate Trend Chart */}
      <div className="flex flex-col h-full px-2">
        <h3 className="text-[20px] font-bold text-text-primary mb-5 px-2">최근 {trendPoints.length || 5}주 달성률</h3>
        <div className="bg-surface rounded-[28px] p-6 w-full">
          <div className="flex items-center gap-8 mb-6 px-2">
            <div>
              <div className="relative group flex items-center gap-1.5 mb-1 w-max">
                <span className="text-[13px] font-bold text-text-muted">실행률</span>
                <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
              <div className="text-[28px] font-black tracking-tight text-text-primary">{currentExecutionRate}<span className="text-[16px] text-text-muted ml-0.5">%</span></div>
            </div>

            <div>
              <div className="relative group flex items-center gap-1.5 mb-1 w-max">
                <span className="text-[13px] font-bold text-text-muted">달성률</span>
                <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
              <div className="text-[28px] font-black tracking-tight text-text-primary">{currentWinRate}<span className="text-[16px] text-text-muted ml-0.5">%</span></div>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <WeeklyRateTrendChart points={trendPoints} />
          </div>
        </div>
      </div>

      {/* Attention Needed */}
      <section id="attention" className="flex flex-col scroll-mt-28 px-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 px-2 gap-4">
              <h3 className="text-[20px] font-bold text-text-primary">{t("attentionItems")}</h3>
              <SegmentedControl
                size="sm"
                value={attentionFilter}
                onChange={setAttentionFilter}
                options={[
                  { value: 'ALL', label: t('filterAll') },
                  { value: 'REQUESTED', label: t('filterRequested') },
                  { value: 'ADJUSTING', label: t('filterAdjusting') },
                  { value: 'RESOLVED', label: t('filterResolved') },
                ]}
              />
            </div>
            
            <div className="bg-surface rounded-[28px] p-6 flex flex-col">
              {attentionItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] text-text-muted text-[15px] font-medium text-center">
                  {t("noAttentionItems")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attentionItems.map((signal) => (
                    <div
                      key={signal.responseId!}
                      className={`w-full text-left p-4 rounded-[20px] transition-colors flex flex-col hover:bg-surface/40 cursor-pointer border border-border/40 bg-white`}
                      onClick={() => setActiveSignalModal(signal.responseId!)}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="relative shrink-0">
                          <UserAvatar
                            avatarSeed={signal.memberNickname || "Member"}
                            alt={signal.memberNickname || "Member"}
                            size={40}
                          />
                          {!signal.isResolved && (
                            <div className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-red-500 rounded-full border-[2.5px] border-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex justify-between items-start w-full mb-0.5">
                            <span className={`text-[14px] font-medium truncate pr-2 ${!signal.isResolved ? 'text-primary' : 'text-[#8B95A1]'}`}>
                              {signal.leadMeasureName}
                            </span>
                            <span className="text-[12px] text-[#8B95A1] shrink-0 mt-0.5">{formatDateRelative(signal.createdAt)}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 text-[15px] leading-snug tracking-tight truncate ${!signal.isResolved ? 'font-bold text-[#191F28]' : 'font-medium text-[#4E5968]'}`}>
                            <span className="truncate">{signal.memberNickname}</span>
                            <span className="text-[#B0B8C1] text-[12px] font-bold">•</span>
                            <span className={`text-[14px] font-bold ${signal.isResolved ? 'text-[#8B95A1]' : signal.signalType === 'BLOCKED' ? 'text-red-500' : 'text-primary'}`}>
                              {signal.isResolved 
                                ? (signal.resolvedProposal?.status === 'ACCEPTED' ? t("statusAdjustDone") 
                                 : signal.resolvedProposal?.status === 'DECLINED' ? t("statusDeclined") 
                                 : t("statusAdjusting")) 
                                : signal.signalType === 'BLOCKED' ? t("signalBlocked") : t("signalAdjust")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </section>

      {/* Recent Activity Log */}
      <section id="history" className="flex flex-col scroll-mt-28 px-2">
            <h3 className="text-[20px] font-bold text-text-primary mb-5 px-2">{t("checkinHistory")}</h3>
            
            <div className="bg-surface rounded-[28px] p-6 flex flex-col">
              {activityLog.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] text-text-muted text-[15px] font-medium text-center">
                  {t("noRecentActivity")}
                </div>
              ) : (
                <div className="relative pl-6 space-y-8">
                  {activityLog.map((activity, i) => {
                    const isLast = i === activityLog.length - 1;
                    return (
                    <div key={activity.checkinId! + i} className="relative flex items-start">
                      <div className={`absolute -left-6 flex items-center justify-center w-10 h-10 rounded-full z-10 transition-transform ${activity.type === 'CHECKIN_SENT' ? 'bg-primary' : 'bg-success'}`}>
                        {activity.type === 'CHECKIN_SENT' ? <Bot className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>

                      {!isLast && (
                        <div className="absolute -left-6 top-10 -bottom-8 w-10 flex justify-center">
                          <div className="w-0.5 h-full bg-border/40" />
                        </div>
                      )}
                      
                      <div className="ml-10 pt-1">
                        <p className="text-[15px] text-text-primary font-bold leading-snug tracking-tight mb-1">
                          {activity.type === 'CHECKIN_SENT' ? t("historySent", { nickname: activity.memberNickname || "", measureName: activity.leadMeasureName || "" }) : t("historyResponded", { nickname: activity.memberNickname || "", measureName: activity.leadMeasureName || "" })}
                        </p>
                        <p className="text-[13px] text-text-muted">
                          {formatDateRelative(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )})}
                </div>
              )}
        </div>
      </section>

      {/* Leader's Action Item Detail Modal */}
      {activeSignalModal && (() => {
        const signal = attentionItems.find(s => s.responseId === activeSignalModal);
        if (!signal) return null;
        
        const canSubmit = buildAdjustmentProposalDraft({
          proposalType,
          proposalNumber,
          proposalReplacementText,
        }) !== null;

        return (
          <Dialog open={!!activeSignalModal} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent 
              className="bg-[#F2F4F6] w-full max-w-[480px] h-[85vh] max-h-[720px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-[0.98] duration-200 p-0"
              overlayClassName="bg-black/60"
            >
              
              <div className="px-6 py-5 flex items-start shrink-0 bg-white z-10 rounded-t-[32px] border-b border-[#F2F4F6] relative">
                <div className="flex gap-4 items-center w-full pr-8">
                  <div className="relative shrink-0">
                    <UserAvatar
                      avatarSeed={signal.memberNickname || "Member"}
                      alt={signal.memberNickname || "Member"}
                      size={46}
                    />
                    {!signal.isResolved && (
                      <div className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-red-500 rounded-full border-[2.5px] border-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[18px] text-[#191F28] font-bold">
                          {signal.memberNickname}
                        </span>
                        <span className="text-[#B0B8C1] text-[12px] font-bold">•</span>
                        <span className={`text-[15px] font-bold ${signal.isResolved ? 'text-[#8B95A1]' : signal.signalType === 'BLOCKED' ? 'text-red-500' : 'text-primary'}`}>
                          {signal.isResolved 
                            ? (signal.resolvedProposal?.status === 'ACCEPTED' ? t("statusAdjustDone") 
                             : signal.resolvedProposal?.status === 'DECLINED' ? t("statusDeclined") 
                             : t("statusAdjusting")) 
                            : signal.signalType === 'BLOCKED' ? t("signalBlocked") : t("signalAdjust")}
                        </span>
                      </div>
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
              
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 bg-white">
                <div className="px-1 space-y-7 mb-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[13px] font-bold text-[#4E5968]">{t("teamMember")}</span>
                      <span className="text-[13px] font-medium text-[#8B95A1]">{formatDateRelative(signal.createdAt)}</span>
                    </div>
                    <div className="bg-[#F2F4F6] rounded-[16px] p-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-bold text-[#8B95A1]">
                          {signal.signalType === 'BLOCKED' ? t("typeBlocked") : t("typeAdjust")}
                        </span>
                        <p className="text-[15px] text-[#333D4B] leading-relaxed font-medium mt-1">
                          {signal.note || "도움이 필요합니다."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {signal.isResolved && signal.resolvedProposal && (
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[13px] font-bold text-primary">{t("myResponse")}</span>
                        <span className="text-[13px] font-medium text-primary">{formatDateRelative(signal.resolvedProposal.createdAt)}</span>
                      </div>
                      <div className="bg-primary/10 rounded-[16px] p-5">
                        {signal.resolvedProposal.leaderNote && (
                          <p className={`text-[15px] text-[#191F28] leading-relaxed font-medium mb-4 whitespace-pre-wrap`}>
                            {signal.resolvedProposal.leaderNote}
                          </p>
                        )}
                        <div className={signal.resolvedProposal.leaderNote ? 'pt-4 border-t border-primary/15' : ''}>
                          <p className="text-[16px] text-[#191F28] leading-relaxed font-bold">
                            {signal.resolvedProposal.actionType === 'CHANGE_TARGET_COUNT' ? '실행 횟수 조정 제안' : 
                             signal.resolvedProposal.actionType === 'ARCHIVE_ACTION_ITEM' ? '아이템 보관 제안' : '대체 목표 제안'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {signal.isResolved && signal.resolvedProposal && (signal.resolvedProposal.status === 'ACCEPTED' || signal.resolvedProposal.status === 'DECLINED') && (
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[13px] font-bold text-[#4E5968]">{t("teamMember")}</span>
                        <span className="text-[13px] font-medium text-[#8B95A1]">{formatDateRelative(signal.resolvedAt || signal.resolvedProposal.createdAt)}</span>
                      </div>
                      <div className="bg-[#F2F4F6] rounded-[16px] p-5">
                        <p className="text-[15px] text-[#333D4B] leading-relaxed font-medium">
                          {signal.resolvedProposal.status === 'ACCEPTED' ? t("proposalAcceptedMsg") : t("proposalDeclinedMsg")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!signal.isResolved && (
                <div className="p-5 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-b-[32px]">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t("commentPlaceholder")}
                      className="flex-1"
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
                        <Input
                          type="number"
                          value={proposalNumber}
                          onChange={(e) => setProposalNumber(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder={t("proposeTargetLabel2")}
                          variant="outline"
                          size="sm"
                          className="w-20 text-center font-bold text-primary"
                          min={1}
                          max={7}
                          autoFocus
                        />
                        <span className="text-[14px] text-[#333D4B] font-medium">회로 조정 제안</span>
                      </div>
                    )}

                    {proposalType === 'replace_action_item' && (
                      <div className="mt-3.5 pt-3.5 border-t border-border/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 px-1">
                        <Input
                          type="text"
                          value={proposalReplacementText}
                          onChange={(e) => setProposalReplacementText(e.target.value)}
                          placeholder={t("proposeReplacePlaceholder")}
                          variant="outline"
                          size="sm"
                          className="flex-1 font-bold"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

            </DialogContent>
          </Dialog>
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
            const ratePayload = payload.find(p => p.dataKey === 'rate');
            const executionRatePayload = payload.find(p => p.dataKey === 'executionRate');
            return (
              <div className="rounded-[12px] bg-zinc-800 px-3 py-1.5 shadow-xl">
                {executionRatePayload && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#84cc16" }} />
                    <p className="font-mono text-[12px] font-bold text-white/70">
                      실행률 <span className="text-white ml-1">{executionRatePayload.value}%</span>
                    </p>
                  </div>
                )}
                <div className={`flex items-center gap-2 ${executionRatePayload ? 'mt-1' : ''}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3a64c7" }} />
                  <p className="font-mono text-[12px] font-bold text-white/70">
                    달성률 <span className="text-white ml-1">{ratePayload?.value ?? 0}%</span>
                  </p>
                </div>
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
