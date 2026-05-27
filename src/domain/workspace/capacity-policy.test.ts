import { describe, expect, it, vi } from "vitest";
import { CapacityPolicy } from "@/domain/workspace/capacity-policy";
import { ConflictError, ForbiddenError } from "@/lib/server/errors";

function createPolicy(input: {
  memberCount: number;
  memberLimit: number | null;
  purchasedSeatCount?: number | null;
}) {
  const storage = {
    countMembers: vi.fn().mockResolvedValue(input.memberCount),
    findPlanLimit: vi.fn().mockResolvedValue(
      input.memberLimit === null ? null : { memberLimit: input.memberLimit },
    ),
    findSeatEntitlement: vi.fn().mockResolvedValue(
      input.purchasedSeatCount === undefined || input.purchasedSeatCount === null
        ? null
        : { purchasedSeatCount: input.purchasedSeatCount },
    ),
  };

  return { policy: new CapacityPolicy(storage), storage };
}

describe("CapacityPolicy", () => {
  it("plan limit이 없으면 멤버 추가를 허용한다", async () => {
    const { policy } = createPolicy({ memberCount: 100, memberLimit: null });

    await expect(
      policy.assertCanAddMember({ id: 1, planCode: "STANDARD" }),
    ).resolves.toBeUndefined();
  });

  it("현재 멤버 수가 limit 미만이면 멤버 추가를 허용한다", async () => {
    const { policy } = createPolicy({ memberCount: 9, memberLimit: 10 });

    await expect(
      policy.assertCanAddMember({ id: 1, planCode: "FREE" }),
    ).resolves.toBeUndefined();
  });

  it("현재 멤버 수가 limit에 도달하면 멤버 추가를 차단한다", async () => {
    const { policy } = createPolicy({ memberCount: 10, memberLimit: 10 });

    await expect(
      policy.assertCanAddMember({ id: 1, planCode: "FREE" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("BASIC workspace는 구매 seat 수를 멤버 한도로 사용한다", async () => {
    const { policy, storage } = createPolicy({
      memberCount: 5,
      memberLimit: null,
      purchasedSeatCount: 5,
    });

    await expect(
      policy.assertCanAddMember({ id: 1, planCode: "BASIC" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(storage.findSeatEntitlement).toHaveBeenCalledWith(1);
    expect(storage.findPlanLimit).not.toHaveBeenCalled();
  });

  it("FREE workspace가 limit을 초과하면 feature 사용을 차단한다", async () => {
    const { policy } = createPolicy({ memberCount: 11, memberLimit: 10 });

    await expect(
      policy.assertWorkspaceUsageAllowed({ id: 1, planCode: "FREE" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("STANDARD workspace는 기존 동작처럼 usage block 대상에서 제외한다", async () => {
    const { policy, storage } = createPolicy({ memberCount: 31, memberLimit: 30 });

    await expect(
      policy.assertWorkspaceUsageAllowed({ id: 1, planCode: "STANDARD" }),
    ).resolves.toBeUndefined();
    expect(storage.countMembers).not.toHaveBeenCalled();
  });
});
