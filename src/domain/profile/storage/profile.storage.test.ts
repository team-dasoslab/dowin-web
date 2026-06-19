import {
  users,
  workspaceBillingState,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  query: {
    users: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    workspaces: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("ProfileStorage", () => {
  const mockDb = {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      workspaces: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  } satisfies MockDb;

  const storage = new ProfileStorage(
    mockDb as unknown as ConstructorParameters<typeof ProfileStorage>[0],
  );

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.returning.mockReturnThis();
    mockDb.delete.mockReturnThis();
  });

  describe("findDeletionContextByUserId", () => {
    it("soft delete 된 워크스페이스 멤버십은 탈퇴 컨텍스트에서 제외한다", async () => {
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 1,
        passwordHash: "hash",
      });
      mockDb.limit.mockResolvedValue([]);

      const result = await storage.findDeletionContextByUserId(1);

      expect(result).toEqual({
        id: 1,
        passwordHash: "hash",
        membership: null,
      });
      expect(mockDb.from).toHaveBeenCalledWith(workspaceMembers);
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        workspaces,
        expect.anything(),
      );
      expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe("countWorkspaceAdmins", () => {
    it("활성 워크스페이스의 ADMIN만 계산한다", async () => {
      mockDb.where.mockResolvedValue([{ count: 2 }]);

      const result = await storage.countWorkspaceAdmins(3);

      expect(result).toBe(2);
      expect(mockDb.from).toHaveBeenCalledWith(workspaceMembers);
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        workspaces,
        expect.anything(),
      );
    });
  });

  describe("deleteUser", () => {
    it("user hard delete 전에 nullable billing owner 참조를 정리한다", async () => {
      await storage.deleteUser(9);

      expect(mockDb.update).toHaveBeenNthCalledWith(1, workspaces);
      expect(mockDb.set).toHaveBeenNthCalledWith(1, {
        billingOwnerUserId: null,
      });
      expect(mockDb.update).toHaveBeenNthCalledWith(2, workspaceBillingState);
      expect(mockDb.set).toHaveBeenNthCalledWith(2, {
        billingOwnerUserId: null,
      });
      expect(mockDb.delete).toHaveBeenCalledWith(users);
    });
  });
});
