import type { TeamCheckinAdjustmentProposalCreateRequest } from "@/api/generated/dowin.schemas";

export type LeaderProposalType =
  | "update_metric"
  | "archive"
  | "replace_action_item";

type BuildAdjustmentProposalDraftInput = {
  proposalType: LeaderProposalType | null;
  proposalNumber: number | "";
  proposalReplacementText: string;
};

export function buildAdjustmentProposalDraft({
  proposalType,
  proposalNumber,
  proposalReplacementText,
}: BuildAdjustmentProposalDraftInput): Pick<
  TeamCheckinAdjustmentProposalCreateRequest,
  "actionType" | "payload"
> | null {
  if (proposalType === "archive") {
    return {
      actionType: "ARCHIVE_ACTION_ITEM",
      payload: { reason: "OTHER" },
    };
  }

  if (proposalType === "update_metric") {
    if (proposalNumber === "") return null;

    const newTargetValue = Number(proposalNumber);
    if (!Number.isInteger(newTargetValue) || newTargetValue < 1 || newTargetValue > 7) {
      return null;
    }

    return {
      actionType: "CHANGE_TARGET_COUNT",
      payload: { newTargetValue },
    };
  }

  if (proposalType === "replace_action_item") {
    const replacementName = proposalReplacementText.trim();
    if (!replacementName) return null;

    return {
      actionType: "REPLACE_ACTION_ITEM",
      payload: {
        replacementName,
        replacementPeriod: "WEEKLY",
        replacementTargetValue: 1,
        replacementTrackingMode: "BOOLEAN",
        replacementDailyTargetCount: 1,
      },
    };
  }

  return null;
}
