import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("TeamMemoService", () => {
  const findUserWorkspace = vi.fn();
  const findMembership = vi.fn();
  const listByWorkspaceAndTarget = vi.fn();
  const create = vi.fn();
  const findById = vi.fn();
  const updateResolved = vi.fn();
  const deleteById = vi.fn();

  const service = new TeamMemoService(
    { findUserWorkspace, findMembership },
    { listByWorkspaceAndTarget, create, findById, updateResolved, deleteById },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("대상 사용자 메모 목록을 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 12, role: "MEMBER" });
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

    const result = await service.listTeamMemos(11, 12);

    expect(result).toEqual({
      workspaceId: 3,
      targetUserId: 12,
      memos: [
        {
          id: 1,
          workspaceId: 3,
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

  it("메모를 생성한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 12, role: "MEMBER" });
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

    const result = await service.createTeamMemo(11, {
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

  it("작성자 또는 ADMIN은 메모 완료 상태를 변경할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 1, role: "ADMIN" });
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

    const result = await service.resolveTeamMemo(1, 5, true);

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
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 11, role: "MEMBER" });
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

    await expect(service.resolveTeamMemo(11, 5, true)).rejects.toThrow(
      "FORBIDDEN",
    );
  });

  it("작성자는 메모를 삭제할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 11, role: "MEMBER" });
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

    await service.deleteTeamMemo(11, 8);

    expect(deleteById).toHaveBeenCalledWith(8);
  });

  it("작성자가 아니면 ADMIN이어도 메모를 삭제할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembership.mockResolvedValue({ userId: 1, role: "ADMIN" });
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

    await expect(service.deleteTeamMemo(1, 8)).rejects.toThrow("FORBIDDEN");
  });
});
