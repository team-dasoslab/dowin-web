import { teamMemos } from "@/db/schema";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  query: {
    teamMemos: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

describe("TeamMemoStorage", () => {
  const mockDb = {
    query: {
      teamMemos: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  } satisfies MockDb;

  const storage = new TeamMemoStorage(
    mockDb as unknown as ConstructorParameters<typeof TeamMemoStorage>[0],
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("대상 사용자 기준 메모 목록을 조회한다", async () => {
    mockDb.query.teamMemos.findMany.mockResolvedValue([
      {
        id: 1,
        workspaceId: 3,
        targetUserId: 12,
        authorUserId: 11,
        content: "메모",
        resolvedAt: null,
        resolvedByUserId: null,
        createdAt: new Date("2026-03-25T12:00:00.000Z"),
        authorUser: {
          id: 11,
          nickname: "지훈",
          avatarKey: null,
        },
      },
    ]);

    const result = await storage.listByWorkspaceAndTarget(3, 12);

    expect(result).toHaveLength(1);
    expect(mockDb.query.teamMemos.findMany).toHaveBeenCalled();
  });

  it("메모를 생성하고 반환한다", async () => {
    mockDb.returning.mockResolvedValueOnce([{ id: 9 }]);
    mockDb.query.teamMemos.findFirst.mockResolvedValue({
      id: 9,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "새 메모",
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 11,
        nickname: "지훈",
        avatarKey: null,
      },
    });

    const result = await storage.create({
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "새 메모",
    });

    expect(mockDb.insert).toHaveBeenCalledWith(teamMemos);
    expect(result.id).toBe(9);
  });

  it("메모 완료 상태를 변경한다", async () => {
    mockDb.returning.mockResolvedValueOnce([{ id: 9 }]);
    mockDb.query.teamMemos.findFirst.mockResolvedValue({
      id: 9,
      workspaceId: 3,
      targetUserId: 12,
      authorUserId: 11,
      content: "완료 메모",
      resolvedAt: new Date("2026-03-25T12:10:00.000Z"),
      resolvedByUserId: 11,
      createdAt: new Date("2026-03-25T12:00:00.000Z"),
      authorUser: {
        id: 11,
        nickname: "지훈",
        avatarKey: null,
      },
    });

    const result = await storage.updateResolved({
      memoId: 9,
      isResolved: true,
      resolvedByUserId: 11,
    });

    expect(mockDb.update).toHaveBeenCalledWith(teamMemos);
    expect(result?.resolvedByUserId).toBe(11);
  });

  it("메모를 삭제한다", async () => {
    mockDb.returning.mockResolvedValue([{ id: 9 }]);

    const result = await storage.deleteById(9);

    expect(mockDb.delete).toHaveBeenCalledWith(teamMemos);
    expect(result).toBe(true);
  });
});
