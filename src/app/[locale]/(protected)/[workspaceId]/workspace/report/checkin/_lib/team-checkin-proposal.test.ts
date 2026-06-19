import { describe, expect, it } from "vitest";
import { teamCheckinAdjustmentProposalCreateSchema } from "@/domain/team-checkin/validation";
import { buildAdjustmentProposalDraft } from "./team-checkin-proposal";

function expectServerValidationPasses(
  draft: ReturnType<typeof buildAdjustmentProposalDraft>,
) {
  expect(draft).not.toBeNull();
  expect(
    teamCheckinAdjustmentProposalCreateSchema.safeParse({
      sourceResponseId: "res_1",
      ...draft,
    }).success,
  ).toBe(true);
}

describe("buildAdjustmentProposalDraft", () => {
  it("builds a valid archive proposal payload", () => {
    expectServerValidationPasses(
      buildAdjustmentProposalDraft({
        proposalType: "archive",
        proposalNumber: "",
        proposalReplacementText: "",
      }),
    );
  });

  it("builds a valid replacement proposal payload", () => {
    expectServerValidationPasses(
      buildAdjustmentProposalDraft({
        proposalType: "replace_action_item",
        proposalNumber: "",
        proposalReplacementText: "새 실행 항목",
      }),
    );
  });

  it("rejects target count proposals outside the backend bounds", () => {
    expect(
      buildAdjustmentProposalDraft({
        proposalType: "update_metric",
        proposalNumber: 8,
        proposalReplacementText: "",
      }),
    ).toBeNull();
  });
});
