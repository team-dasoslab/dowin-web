"use client";

import React, { useState } from "react";
import { Inbox, ChevronLeft, CheckCircle2, Clock, AlertCircle, FileEdit, X, Bot } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkspacesWorkspaceIdTeamCheckinsInbox,
  usePostWorkspacesWorkspaceIdTeamCheckinsCheckinIdResponse,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdAccept,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdDecline,
  getGetWorkspacesWorkspaceIdTeamCheckinsInboxQueryKey,
  useGetWorkspacesWorkspaceIdTeamCheckinsSettings
} from "@/api/generated/team-checkins/team-checkins";
import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useTranslations } from "next-intl";
import {
  TeamCheckinInboxCheckinItem,
  TeamCheckinInboxProposalItem,
} from "@/api/generated/dowin.schemas";

type CheckInStatus = "pending" | "done" | "later" | "blocked" | "adjust" | "leader_comment" | "adjusted" | "declined";

interface ProposalAction {
  type: "update_metric" | "archive" | "create_new";
  description: string;
}

interface NotificationItem {
  id: string;
  sourceCheckinId?: string;
  proposalId?: string;
  actionItemName: string;
  date: string;
  isUnread: boolean;
  content: string;
  status: CheckInStatus;
  leaderComment?: string;
  myRequest?: string;
  proposal?: ProposalAction;
  type?: "human" | "system_alert";
}

export function TeamMemberCheckIn() {
  const t = useTranslations("TeamCheckin");

  function formatDate(dateString?: string | null) {
    if (!dateString) return t("justNow");
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return t("justNow");
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const { workspaceId } = useParams() as { workspaceId: string };
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"blocked" | "adjust" | null>(null);
  const [actionReason, setActionReason] = useState("");
  
  const { data: inboxResponse } = useGetWorkspacesWorkspaceIdTeamCheckinsInbox(
    workspaceId,
    { status: "open" }
  );
  
  const { data: userResponse } = useGetUsersMe();
  const { data: checkinSettingsResponse } = useGetWorkspacesWorkspaceIdTeamCheckinsSettings(workspaceId);

  const submitResponse = usePostWorkspacesWorkspaceIdTeamCheckinsCheckinIdResponse();
  const acceptProposal = usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdAccept();
  const declineProposal = usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdDecline();

  const isWorkspaceAdmin = userResponse?.status === 200 && userResponse.data.role === "ADMIN";
  const checkinSettings = checkinSettingsResponse?.status === 200 && 'enabled' in checkinSettingsResponse.data ? checkinSettingsResponse.data : null;
  
  if (isWorkspaceAdmin && !checkinSettings?.includeAdminAsMember) {
    return null;
  }

  const inboxItems = inboxResponse?.status === 200 ? inboxResponse.data.items || [] : [];
  
  // Map API items to NotificationItem
  const notifications: NotificationItem[] = inboxItems.map((item) => {
    if (item.type === "CHECKIN") {
      const chk = item as TeamCheckinInboxCheckinItem;
      let status: CheckInStatus = "pending";
      let content = t("msgNoLog", { measureName: chk.leadMeasureName || "" });
      
      if (chk.reasonCode === "SLOW_WEEKLY_START") {
        content = t("msgSlowStart");
      }

      if (chk.response) {
        if (chk.response.responseType === "LOG_NOW") status = "done";
        if (chk.response.responseType === "SNOOZE_TODAY") status = "later";
        if (chk.response.responseType === "BLOCKED") status = "blocked";
        if (chk.response.responseType === "ADJUSTMENT_REQUESTED") status = "adjust";
      }

      return {
        id: chk.id!,
        actionItemName: chk.leadMeasureName || "",
        date: formatDate(chk.sentAt),
        isUnread: !chk.response,
        content,
        status,
        type: "system_alert"
      };
    } else {
      const prop = item as TeamCheckinInboxProposalItem;
      let status: CheckInStatus = "leader_comment";
      if (prop.status === "ACCEPTED") status = "adjusted";
      if (prop.status === "DECLINED") status = "declined";
      
      let description = t("leaderProposal");
      let pType: ProposalAction["type"] = "update_metric";
      if (prop.actionType === "CHANGE_TARGET_COUNT") {
        const payload = prop.payload as { newTargetValue?: number };
        description = `목표 횟수 변경 (${payload.newTargetValue}건으로)`;
      } else if (prop.actionType === "ARCHIVE_ACTION_ITEM") {
        pType = "archive";
        description = "현재 액션 아이템 보관하기";
      } else if (prop.actionType === "REPLACE_ACTION_ITEM") {
        pType = "create_new";
        const payload = prop.payload as { replacementName?: string };
        description = `새 액션 아이템으로 변경: ${payload.replacementName}`;
      }

      return {
        id: prop.id!,
        proposalId: prop.id,
        sourceCheckinId: prop.sourceCheckinId,
        actionItemName: prop.leadMeasureName || "",
        date: formatDate(prop.expiresAt),
        isUnread: prop.status === "PROPOSED",
        content: "리더님이 목표 조정을 제안했습니다.",
        status,
        leaderComment: prop.leaderNote || "조정 제안을 보냈습니다.",
        myRequest: t("requestAdjustDesc"),
        proposal: {
          type: pType,
          description
        },
        type: "human"
      };
    }
  });

  const selectedItem = notifications.find(n => n.id === selectedId);
  const unreadCount = notifications.filter(n => n.isUnread).length;

  const handleResponse = async (checkinId: string, responseType: "LOG_NOW" | "SNOOZE_TODAY" | "BLOCKED" | "ADJUSTMENT_REQUESTED", note?: string) => {
    try {
      await submitResponse.mutateAsync({
        workspaceId,
        checkinId,
        data: {
          responseType,
          note: note || null,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetWorkspacesWorkspaceIdTeamCheckinsInboxQueryKey(workspaceId) });
      setSelectedId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposalDecision = async (proposalId: string, decision: "accept" | "decline") => {
    try {
      if (decision === "accept") {
        await acceptProposal.mutateAsync({ workspaceId, proposalId });
      } else {
        await declineProposal.mutateAsync({ workspaceId, proposalId, data: { reason: "KEEP_CURRENT_GOAL" } });
      }
      queryClient.invalidateQueries({ queryKey: getGetWorkspacesWorkspaceIdTeamCheckinsInboxQueryKey(workspaceId) });
      setSelectedId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusUI = (status: CheckInStatus) => {
    switch (status) {
      case "done": return { icon: <CheckCircle2 className="w-8 h-8 text-primary" />, text: t("statusDone"), desc: t("statusDoneDesc"), color: "text-primary" };
      case "later": return { icon: <Clock className="w-8 h-8 text-text-primary" />, text: t("statusLater"), desc: t("statusLaterDesc"), color: "text-text-primary" };
      case "blocked": return { icon: <AlertCircle className="w-8 h-8 text-danger" />, text: t("statusBlocked"), desc: t("statusBlockedDesc"), color: "text-danger" };
      case "adjust": return { icon: <FileEdit className="w-8 h-8 text-text-secondary" />, text: t("statusAdjust"), desc: t("statusAdjustDesc"), color: "text-text-secondary" };
      case "adjusted": return { icon: <CheckCircle2 className="w-8 h-8 text-primary" />, text: t("statusAdjusted"), desc: t("statusAdjustedDesc"), color: "text-primary" };
      case "declined": return { icon: <X className="w-8 h-8 text-text-secondary" />, text: t("statusDeclined"), desc: t("statusDeclinedDesc"), color: "text-text-secondary" };
      case "leader_comment": return null;
      default: return null;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[90px] lg:bottom-6 right-4 lg:right-6 z-[9990] w-14 h-14 rounded-[20px] shadow-lg flex items-center justify-center transition-colors duration-300 ${
          isOpen ? "hidden lg:flex bg-surface border border-border/40 text-text-primary" : "bg-primary text-white"
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-5 h-5 bg-danger text-white text-[11px] font-bold flex items-center justify-center rounded-full border-[2.5px] border-surface">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:inset-auto lg:bottom-24 right-0 lg:right-6 lg:w-[380px] h-[100dvh] lg:h-[640px] lg:max-h-[85vh] bg-surface lg:rounded-[28px] lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-dowin-in lg:origin-bottom-right">
          
          {!selectedId ? (
            <>
              <div className="bg-surface px-6 pt-12 lg:pt-8 pb-4 shrink-0 flex items-center justify-between">
                <h1 className="text-[24px] font-bold text-text-primary tracking-tight flex items-center gap-2">
                  Inbox
                  {unreadCount > 0 && (
                    <span className="ml-2 text-primary">{unreadCount}</span>
                  )}
                </h1>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden p-2 -mr-2 text-text-muted hover:bg-sub-background rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    {t("inboxEmpty")}
                  </div>
                ) : notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setSelectedId(n.id);
                    }}
                    className={`w-full flex gap-3 text-left p-4 rounded-[20px] transition-all duration-200 relative ${n.isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'bg-transparent hover:bg-sub-background'}`}
                  >
                    <div className="relative shrink-0 pt-0.5">
                      {n.type === 'system_alert' ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] bg-primary/10">
                          <Bot className="w-[20px] h-[20px] text-primary" />
                        </div>
                      ) : (
                        <UserAvatar alt="Leader" size={40} shape="circle" avatarSeed="leader-kim" />
                      )}
                      {n.isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start w-full mb-0.5">
                        <span className={`text-[14px] font-medium truncate pr-2 ${n.isUnread ? 'text-primary' : 'text-[#8B95A1]'}`}>
                          {n.actionItemName}
                        </span>
                        <span className="text-[12px] text-[#8B95A1] shrink-0 mt-0.5">{n.date}</span>
                      </div>
                      
                      <p className={`text-[15px] leading-snug tracking-tight line-clamp-2 ${n.isUnread ? 'font-bold text-[#191F28]' : 'font-medium text-[#4E5968]'}`}>
                        {n.content.split('\n')[0]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full bg-surface">
              <div className="px-4 py-4 pt-12 lg:pt-4 flex items-center shrink-0">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setPendingAction(null);
                    setActionReason("");
                  }}
                  className="p-2 hover:bg-sub-background rounded-full transition-colors text-text-primary shrink-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                {selectedItem && (
                  <div className="flex flex-col justify-center ml-2 mr-4 min-w-0">
                    <span className="text-[16px] font-bold text-[#191F28] truncate">{selectedItem.actionItemName}</span>
                    <span className={`text-[13px] font-bold ${selectedItem.status === 'adjusted' ? 'text-[#8B95A1]' : 'text-primary'}`}>
                      {selectedItem.status === 'pending' ? t("statusPending") :
                       selectedItem.status === 'leader_comment' ? t("statusAdjusting") : 
                       selectedItem.status === 'adjusted' ? t("statusAdjustDone") : 
                       getStatusUI(selectedItem.status)?.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 px-6 pb-6 overflow-y-auto flex flex-col animate-dowin-in">
                {/* Initial System Request (Always Visible) */}
                <div className="flex flex-col gap-2 mt-2 mb-8 shrink-0">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[13px] font-bold text-primary">{t("system")}</span>
                    <span className="text-[13px] font-medium text-primary">{selectedItem?.date}</span>
                  </div>
                  <div className="bg-primary/10 rounded-[24px] rounded-tl-[8px] p-5">
                    <h2 className="text-[16px] font-bold text-[#191F28] leading-[1.4] tracking-tight mb-2">
                      {t.rich("msgNoLogRich", { measureName: selectedItem?.actionItemName || '', highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
                    </h2>
                    <p className="text-[15px] text-[#191F28] leading-relaxed font-medium">
                      {t("msgNoLogSub")}
                    </p>
                  </div>
                </div>

                {selectedItem?.status === "pending" ? (
                  <div className="flex flex-col h-full animate-dowin-in">
                    <div className="mt-auto flex flex-col gap-3">
                      <button
                        onClick={() => handleResponse(selectedItem.id, "LOG_NOW")}
                        disabled={submitResponse.isPending}
                        className="w-full py-[18px] rounded-[16px] bg-primary text-white text-[16px] font-bold transition-transform active:scale-[0.98] shadow-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        방금 완료했어요
                      </button>
                      <button
                        onClick={() => handleResponse(selectedItem.id, "SNOOZE_TODAY")}
                        disabled={submitResponse.isPending}
                        className="w-full py-[18px] rounded-[16px] bg-[#F2F4F6] text-[#4E5968] text-[16px] font-bold transition-transform active:scale-[0.98] hover:bg-[#E5E8EB] disabled:opacity-50"
                      >
                        오늘 나중에 할게요
                      </button>
                      
                      <div className="flex justify-center items-center gap-4 mt-3 mb-1">
                        <button
                          onClick={() => setPendingAction(pendingAction === "blocked" ? null : "blocked")}
                          className={`text-[14px] font-bold transition-colors underline-offset-4 hover:underline ${pendingAction === 'blocked' ? 'text-[#F04438]' : 'text-[#8B95A1]'}`}
                        >
                          막힘 있어요
                        </button>
                        <div className="w-[3px] h-[3px] rounded-full bg-[#D1D6DB]" />
                        <button
                          onClick={() => setPendingAction(pendingAction === "adjust" ? null : "adjust")}
                          className={`text-[14px] font-bold transition-colors underline-offset-4 hover:underline ${pendingAction === 'adjust' ? 'text-primary' : 'text-[#8B95A1]'}`}
                        >
                          목표를 조정할래요
                        </button>
                      </div>

                      {(pendingAction === "blocked" || pendingAction === "adjust") && (
                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 p-1">
                          <input
                            autoFocus
                            type="text"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder={pendingAction === "blocked" ? t("blockedPlaceholder") : t("adjustPlaceholder")}
                            className="flex-1 bg-[#F2F4F6] border-none rounded-[16px] px-5 py-[16px] text-[15px] font-medium text-[#191F28] placeholder:text-[#8B95A1] outline-none focus:ring-2 focus:ring-[#3182F6]/30 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && actionReason.trim() && !submitResponse.isPending) {
                                handleResponse(selectedItem.id, pendingAction === "blocked" ? "BLOCKED" : "ADJUSTMENT_REQUESTED", actionReason.trim());
                                setPendingAction(null);
                                setActionReason("");
                              }
                            }}
                          />
                          <button
                            disabled={!actionReason.trim() || submitResponse.isPending}
                            onClick={() => {
                              handleResponse(selectedItem.id, pendingAction === "blocked" ? "BLOCKED" : "ADJUSTMENT_REQUESTED", actionReason.trim());
                              setPendingAction(null);
                              setActionReason("");
                            }}
                            className={`shrink-0 px-6 text-white text-[15px] font-bold rounded-[16px] transition-all disabled:opacity-50 disabled:bg-[#D1D6DB] ${pendingAction === 'blocked' ? 'bg-[#F04438] hover:bg-[#D92D20]' : 'bg-primary hover:bg-primary/90'}`}
                          >
                            전송
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedItem?.status === "leader_comment" || selectedItem?.status === "adjusted" || selectedItem?.status === "declined" ? (
                  <div className="flex flex-col h-full">
                    <div className="flex flex-col gap-6">

                      <div className="px-1 space-y-7 mb-8">
                        {selectedItem.myRequest && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[13px] font-bold text-[#4E5968]">{t("myRequest")}</span>
                              <span className="text-[13px] font-medium text-[#8B95A1]">{t("previous")}</span>
                            </div>
                            <div className="bg-[#F2F4F6] rounded-[24px] rounded-tl-[8px] p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <FileEdit className="w-4 h-4 text-[#8B95A1]" />
                                <span className="text-[13px] font-bold text-[#8B95A1]">{t("requestAdjustDesc")}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedItem.leaderComment && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[13px] font-bold text-primary">{t("leaderComment")}</span>
                              <span className="text-[13px] font-medium text-primary">{selectedItem.date}</span>
                            </div>
                            <div className="bg-primary/10 rounded-[24px] rounded-tr-[8px] p-5">
                              <p className={`text-[15px] text-[#191F28] leading-relaxed font-medium ${selectedItem.proposal ? 'mb-4' : ''}`}>
                                {selectedItem.leaderComment}
                              </p>
                              
                              {selectedItem.proposal && (
                                <div className="bg-white rounded-[16px] p-4 border border-primary/10 shadow-[0_2px_10px_rgba(49,130,246,0.05)]">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[12px] font-bold text-primary">{t("leaderProposal")}</span>
                                    <span className="text-[16px] font-bold text-[#191F28]">{selectedItem.proposal.description}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedItem.status === 'leader_comment' && selectedItem.proposalId && (
                      <div className="mt-auto flex gap-3 pt-8 pb-2">
                        <button 
                          disabled={acceptProposal.isPending || declineProposal.isPending}
                          onClick={() => handleProposalDecision(selectedItem.proposalId!, "decline")}
                          className="flex-1 py-4 bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968] text-[16px] font-bold rounded-[16px] transition-colors disabled:opacity-50"
                        >
                          기존 목표 유지
                        </button>
                        <button 
                          disabled={acceptProposal.isPending || declineProposal.isPending}
                          onClick={() => handleProposalDecision(selectedItem.proposalId!, "accept")}
                          className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white text-[16px] font-bold rounded-[16px] transition-colors shadow-sm disabled:opacity-50"
                        >
                          수정사항 반영
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-full animate-dowin-in">
                    <div className="flex flex-col gap-6">
                      <div className="px-1 space-y-7 mb-8">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[13px] font-bold text-[#4E5968]">{t("myResponse")}</span>
                            <span className="text-[13px] font-medium text-[#8B95A1]">{selectedItem!.date}</span>
                          </div>
                          <div className="bg-[#F2F4F6] rounded-[24px] rounded-tl-[8px] p-5">
                            <span className="text-[14px] font-bold text-[#8B95A1]">
                              {getStatusUI(selectedItem!.status)?.text}
                            </span>
                            <p className="text-[15px] text-[#333D4B] leading-relaxed font-medium mt-1">
                              {selectedItem!.status === 'done' && '{t("statusDoneDesc")}'}
                              {selectedItem!.status === 'later' && '{t("statusLaterDesc")}'}
                              {selectedItem!.status === 'blocked' && '{t("statusBlockedDesc")}'}
                              {selectedItem!.status === 'adjust' && '상황에 맞게 목표 조율을 요청했어요.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[13px] font-bold text-primary">{t("system")}</span>
                            <span className="text-[13px] font-medium text-primary">{t("justNow")}</span>
                          </div>
                          <div className="bg-primary/10 rounded-[24px] rounded-tr-[8px] p-5">
                            <p className="text-[15px] text-[#191F28] leading-relaxed font-medium">
                              {getStatusUI(selectedItem!.status)?.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
