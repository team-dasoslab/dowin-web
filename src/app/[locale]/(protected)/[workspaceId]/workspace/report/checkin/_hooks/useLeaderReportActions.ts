import { TeamCheckinReportResponseAttentionItemsItem } from "@/api/generated/dowin.schemas";
import {
  getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals,
} from "@/api/generated/team-checkins/team-checkins";
import {
  addDays,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buildAdjustmentProposalDraft } from "../_lib/team-checkin-proposal";

export const useLeaderReportActions = (workspaceId: string) => {
  const t = useTranslations("TeamCheckin");
  const queryClient = useQueryClient();

  const today = getTodayInKst();
  const [selectedDate, setSelectedDateState] = useState(today);
  const selectedWeekStart = getWeekDates(selectedDate)[0] ?? today;
  const currentWeekStart = getWeekDates(today)[0] ?? today;

  const [activeSignalModal, setActiveSignalModal] = useState<string | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const [proposalType, setProposalType] = useState<
    "update_metric" | "archive" | "replace_action_item" | null
  >(null);
  const [proposalNumber, setProposalNumber] = useState<number | "">("");
  const [proposalReplacementText, setProposalReplacementText] = useState("");

  const submitProposal =
    usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposals();

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

  const closeModal = () => {
    setActiveSignalModal(null);
    setProposalType(null);
    setProposalNumber("");
    setProposalReplacementText("");
    setCommentText("");
  };

  const handleResolveSignal = async (
    signal: TeamCheckinReportResponseAttentionItemsItem,
  ) => {
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
          leaderNote: commentText || null,
        },
      });
      queryClient.invalidateQueries({
        queryKey:
          getGetWorkspacesWorkspaceIdTeamCheckinsReportQueryKey(workspaceId),
      });
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    t,
    today,
    selectedDate,
    selectedWeekStart,
    currentWeekStart,
    activeSignalModal,
    setActiveSignalModal,
    commentText,
    setCommentText,
    proposalType,
    setProposalType,
    proposalNumber,
    setProposalNumber,
    proposalReplacementText,
    setProposalReplacementText,
    formatDateRelative,
    movePeriod,
    setSelectedDate,
    resetToToday,
    getWeekDatesFromStart,
    closeModal,
    handleResolveSignal,
    submitProposal,
  };
};
