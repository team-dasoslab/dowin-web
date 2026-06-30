import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("TeamMemoService", () => {
  const findMembership = vi.fn();
  const countMembers = vi.fn();
  const findPlanLimit = vi.fn();
  const listByWorkspaceAndTarget = vi.fn();
  const create = vi.fn();
  const findById = vi.fn();
  const updateResolved = vi.fn();
  const deleteById = vi.fn();

  const service = new TeamMemoService(
    { findMembership, countMembers, findPlanLimit },
    { listByWorkspaceAndTarget, create, findById, updateResolved, deleteById },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    findMembership.mockResolvedValue({ userId: 12, role: "MEMBER" });
    countMembers.mockResolvedValue(1);
    findPlanLimit.mockResolvedValue({ memberLimit: 10 });
  });

  const mockContext = {
    workspaceId: 3,
    workspacePublicId: "ws_3",
    workspaceName: "팀",
    userId: 11,
    role: "MEMBER" as const,
    membershipId: 100,
    allowPastDailyLogEdit: false,
    entitlement: {
      canAccessBasicSubscription: true,
      entitlementSource: "POLAR" as const,
      billingStatus: "ACTIVE" as const,
      planCode: "BASIC" as const,
    },
  } satisfies WorkspaceAccessContext;

  it("대상 사용자 메모 목록을 반환한다", async () => {
    listByWorkspaceAndTarget.mockResolvedValue([
      {
        id: 1,
        workspaceId: 3,
        targetUserId: 12,
        authorUserId: 11,
        content: "이번 주 회고 남기기",
        resolvedAt: null,
        resolvedByUserId: null,
        createdAt: new Date("2026-03-25T12:00:00.000Z"),
        authorUser: {
          id: 11,
          nickname: "지훈",
          avatarKey: "smile.blue",
        },
      },
    ]);

    const result = await service.listTeamMemos(mockContext, 12);

    expect(result).toEqual({
      workspaceId: "ws_3",
      targetUserId: 12,
      memos: [
        {
          id: 1,
          workspaceId: "ws_3",
          targetUserId: 12,
          author: {
            userId: 11,
            nickname: "지훈",
            avatarKey: "smile.blue",
          },
          content: "이번 주 회고 남기기",
          isResolved: false,
          resolvedAt: null,
          resolvedByUserId: null,
          createdAt: "2026-03-25T12:00:00.000Z",
        },
      ],
    });
  });

  it("Basic entitlement가 없으면 메모 목록을 조회할 수 없다", async () => {
    const inactiveContext = {
      ...mockContext,
      entitlement: {
        canAccessBasicSubscription: false,
        entitlementSource: null,
        billingStatus: "NONE" as const,
        planCode: "FREE" as const,
      },
    } satisfies WorkspaceAccessContext;

    await expect(
      service.listTeamMemos(inactiveContext, 12),
    ).rejects.toThrow("BASIC_SUBSCRIPTION_REQUIRED");
    expect(listByWorkspaceAndTarget).not.toHaveBeenCalled();
  });

  it("메모를 생성한다", async () => {
    create.mockResolvedValue({
      id: 2,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "다음 액션 정리",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:05:00.000Z"),
      authorUser: {
        id: 11,
        nickname: "지훈",
        avatarKey: null,
      },
    });

    const result = await service.createTeamMemo(mockContext, {
      targetUserId: 12,
      content: "  다음 액션 정리 ",
    });

    expect(create).toHaveBeenCalledWith({
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "다음 액션 정리",
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 2,
        content: "다음 액션 정리",
      }),
    );
  });

  it("Basic entitlement가 없으면 메모를 생성할 수 없다", async () => {
    const inactiveContext = {
      ...mockContext,
      entitlement: {
        canAccessBasicSubscription: false,
        entitlementSource: null,
        billingStatus: "NONE" as const,
        planCode: "FREE" as const,
      },
    } satisfies WorkspaceAccessContext;

    await expect(
      service.createTeamMemo(inactiveContext, {
        targetUserId: 12,
        content: "다음 액션 정리",
      }),
    ).rejects.toThrow("BASIC_SUBSCRIPTION_REQUIRED");
    expect(create).not.toHaveBeenCalled();
  });

  it("작성자 또는 ADMIN은 메모 완료 상태를 변경할 수 있다", async () => {
    const adminContext = {
      ...mockContext,
      userId: 1,
      role: "ADMIN" as const,
    } satisfies WorkspaceAccessContext;
    findById.mockResolvedValue({
      id: 5,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 9,
      content: "완료 처리 테스트",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 9,
        nickname: "민서",
        avatarKey: null,
      },
    });
    updateResolved.mockResolvedValue({
      id: 5,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 9,
      content: "완료 처리 테스트",
      resolvedAt: new Date("2026-03-25T12:10:00.000Z"),
      resolvedByUserId: 1,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 9,
        nickname: "민서",
        avatarKey: null,
      },
    });

    const result = await service.resolveTeamMemo(adminContext, 5, true);

    expect(updateResolved).toHaveBeenCalledWith({
      memoId: 5,
      isResolved: true,
      resolvedByUserId: 1,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 5,
        isResolved: true,
        resolvedByUserId: 1,
      }),
    );
  });

  it("작성자도 ADMIN도 아니면 완료 상태를 변경할 수 없다", async () => {
    findById.mockResolvedValue({
      id: 5,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 9,
      content: "완료 처리 테스트",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 9,
        nickname: "민서",
        avatarKey: null,
      },
    });

    await expect(service.resolveTeamMemo(mockContext, 5, true)).rejects.toThrow(
      "FORBIDDEN",
    );
  });

  it("작성자는 메모를 삭제할 수 있다", async () => {
    findById.mockResolvedValue({
      id: 8,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "삭제 테스트",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 11,
        nickname: "지훈",
        avatarKey: null,
      },
    });
    deleteById.mockResolvedValue(true);

    await service.deleteTeamMemo(mockContext, 8);

    expect(deleteById).toHaveBeenCalledWith(8);
  });

  it("작성자가 아니면 ADMIN이어도 메모를 삭제할 수 없다", async () => {
    const adminContext = {
      ...mockContext,
      userId: 1,
      role: "ADMIN" as const,
    } satisfies WorkspaceAccessContext;
    findById.mockResolvedValue({
      id: 8,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "삭제 테스트",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 11,
        nickname: "지훈",
        avatarKey: null,
      },
    });

    await expect(service.deleteTeamMemo(adminContext, 8)).rejects.toThrow("FORBIDDEN");
  });
});
