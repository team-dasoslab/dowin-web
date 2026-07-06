import {
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdAccept,
  usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdDecline,
  usePostWorkspacesWorkspaceIdTeamCheckinsCheckinIdResponse,
} from "@/api/generated/team-checkins/team-checkins";
import { useToast } from "@/context/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, FileEdit, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type CheckInStatus =
  | "pending"
  | "done"
  | "later"
  | "blocked"
  | "adjust"
  | "leader_comment"
  | "adjusted"
  | "declined";

export const useTeamMemberCheckInActions = (workspaceId: string) => {
  const t = useTranslations("TeamCheckin");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const submitResponse =
    usePostWorkspacesWorkspaceIdTeamCheckinsCheckinIdResponse();
  const acceptProposal =
    usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdAccept();
  const declineProposal =
    usePostWorkspacesWorkspaceIdTeamCheckinsAdjustmentProposalsProposalIdDecline();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t("justNow");
    const d = new Date(dateString).getTime();
    if (isNaN(d)) return t("justNow");

    const diffMin = Math.floor((Date.now() - d) / (1000 * 60));
    if (diffMin <= 0) return t("justNow");
    if (diffMin < 60) return t("minsAgo", { n: diffMin });

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t("hoursAgo", { n: diffHour });

    return t("daysAgo", { n: Math.floor(diffHour / 24) });
  };

  const invalidateWorkspaceData = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        if (typeof key !== "string") return false;
        return (
          key.startsWith(`/api/workspaces/${workspaceId}/team-checkins`) ||
          key.startsWith(`/api/workspaces/${workspaceId}/scoreboards`) ||
          key.startsWith(`/api/workspaces/${workspaceId}/dashboard`) ||
          key.startsWith(`/api/workspaces/${workspaceId}/action-items`)
        );
      },
    });
  };

  const handleResponse = async (
    checkinId: string,
    responseType:
      | "LOG_NOW"
      | "SNOOZE_TODAY"
      | "BLOCKED"
      | "ADJUSTMENT_REQUESTED",
    note?: string,
  ) => {
    try {
      await submitResponse.mutateAsync({
        workspaceId,
        checkinId,
        data: {
          responseType,
          note: note || null,
        },
      });
      invalidateWorkspaceData();
      if (responseType === "LOG_NOW")
        showToast("success", t("toastStatusDone"));
      else if (responseType === "BLOCKED")
        showToast("success", t("toastStatusBlocked"));
      else if (responseType === "ADJUSTMENT_REQUESTED")
        showToast("success", t("toastStatusAdjust"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposalDecision = async (
    proposalId: string,
    decision: "accept" | "decline",
  ) => {
    try {
      if (decision === "accept") {
        await acceptProposal.mutateAsync({ workspaceId, proposalId });
        showToast("success", t("toastStatusAdjusted"));
      } else {
        await declineProposal.mutateAsync({
          workspaceId,
          proposalId,
          data: { reason: "KEEP_CURRENT_GOAL" },
        });
        showToast("success", t("toastStatusDeclined"));
      }
      invalidateWorkspaceData();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusUI = (status: CheckInStatus) => {
    switch (status) {
      case "done":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-primary" />,
          text: t("statusDone"),
          color: "text-primary",
        };
      case "later":
        return {
          icon: <Clock className="w-8 h-8 text-text-primary" />,
          text: t("statusLater"),
          color: "text-text-primary",
        };
      case "blocked":
        return {
          icon: <AlertCircle className="w-8 h-8 text-danger" />,
          text: t("statusBlocked"),
          color: "text-danger",
        };
      case "adjust":
        return {
          icon: <FileEdit className="w-8 h-8 text-text-secondary" />,
          text: t("statusAdjust"),
          color: "text-text-secondary",
        };
      case "adjusted":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-primary" />,
          text: t("statusAdjusted"),
          color: "text-primary",
        };
      case "declined":
        return {
          icon: <X className="w-8 h-8 text-text-secondary" />,
          text: t("statusDeclined"),
          color: "text-text-secondary",
        };
      case "leader_comment":
        return null;
      default:
        return null;
    }
  };

  return {
    formatDate,
    handleResponse,
    handleProposalDecision,
    getStatusUI,
    submitResponse,
    acceptProposal,
    declineProposal,
  };
};
