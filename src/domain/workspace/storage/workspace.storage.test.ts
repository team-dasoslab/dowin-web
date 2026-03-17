import { workspaceMembers, workspaces } from "@/db/schema";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  query: {
    workspaces: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    workspaceMembers?: {
      findFirst?: ReturnType<typeof vi.fn>;
      findMany?: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

describe("WorkspaceStorage", () => {
  const mockDb = {
    query: {
      workspaces: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  } satisfies MockDb;

  const storage = new WorkspaceStorage(mockDb);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findUserWorkspace", () => {
    it("사용자가 소속된 워크스페이스 정보를 반환한다", async () => {
      const mockWorkspace = { id: 1, name: "Test Workspace" };
      mockDb.query = {
        workspaceMembers: {
          findFirst: vi.fn().mockResolvedValue({ workspace: mockWorkspace }),
        },
      };

      const result = await storage.findUserWorkspace(123);

      expect(result).toEqual(mockWorkspace);
      expect(mockDb.query.workspaceMembers.findFirst).toHaveBeenCalled();
    });
  });

  describe("findWorkspaceById", () => {
    it("워크스페이스 id로 조회한다", async () => {
      const mockWorkspace = { id: 1, name: "Test Workspace" };
      mockDb.query.workspaces.findFirst.mockResolvedValue(mockWorkspace);

      const result = await storage.findWorkspaceById(1);

      expect(result).toEqual(mockWorkspace);
      expect(mockDb.query.workspaces.findFirst).toHaveBeenCalled();
    });
  });

  describe("createWorkspace", () => {
    it("새 워크스페이스를 생성하고 반환한다", async () => {
      const mockWorkspace = { id: 1, name: "New Workspace" };
      mockDb.returning.mockResolvedValue([mockWorkspace]);

      const result = await storage.createWorkspace("New Workspace");

      expect(result).toEqual(mockWorkspace);
      expect(mockDb.insert).toHaveBeenCalledWith(workspaces);
    });
  });

  describe("addMember", () => {
    it("워크스페이스에 멤버를 추가한다", async () => {
      await storage.addMember(1, 123, "ADMIN");

      expect(mockDb.insert).toHaveBeenCalledWith(workspaceMembers);
      expect(mockDb.values).toHaveBeenCalledWith({
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });
    });
  });

  describe("updateWorkspaceName", () => {
    it("워크스페이스 이름을 수정하고 반환한다", async () => {
      const mockWorkspace = { id: 1, name: "새 이름" };
      mockDb.returning.mockResolvedValue([mockWorkspace]);

      const result = await storage.updateWorkspaceName(1, "새 이름");

      expect(result).toEqual(mockWorkspace);
      expect(mockDb.update).toHaveBeenCalledWith(workspaces);
      expect(mockDb.set).toHaveBeenCalledWith({
        name: "새 이름",
      });
    });
  });

  describe("findMembers", () => {
    it("워크스페이스 멤버 목록을 반환한다", async () => {
      const mockMembers = [{ user: { nickname: "Tester" } }];
      mockDb.query.workspaceMembers = {
        ...mockDb.query.workspaceMembers,
        findMany: vi.fn().mockResolvedValue(mockMembers),
      };

      const result = await storage.findMembers(1);

      expect(result).toEqual(mockMembers);
      expect(mockDb.query.workspaceMembers.findMany).toHaveBeenCalled();
    });
  });

  describe("findMembershipByUserId", () => {
    it("사용자의 멤버십을 반환한다", async () => {
      const mockMembership = { userId: 123, role: "ADMIN" };
      mockDb.query.workspaceMembers = {
        ...mockDb.query.workspaceMembers,
        findFirst: vi.fn().mockResolvedValue(mockMembership),
      };

      const result = await storage.findMembershipByUserId(123);

      expect(result).toEqual(mockMembership);
      expect(mockDb.query.workspaceMembers.findFirst).toHaveBeenCalled();
    });
  });

  describe("findMembership", () => {
    it("특정 워크스페이스의 멤버십을 반환한다", async () => {
      const mockMembership = { workspaceId: 1, userId: 123, role: "MEMBER" };
      mockDb.query.workspaceMembers = {
        ...mockDb.query.workspaceMembers,
        findFirst: vi.fn().mockResolvedValue(mockMembership),
      };

      const result = await storage.findMembership(1, 123);

      expect(result).toEqual(mockMembership);
      expect(mockDb.query.workspaceMembers.findFirst).toHaveBeenCalled();
    });
  });

  describe("findMembershipById", () => {
    it("특정 멤버십 id를 조회한다", async () => {
      const mockMembership = { id: 9, workspaceId: 1, userId: 123, role: "MEMBER" };
      mockDb.query.workspaceMembers = {
        ...mockDb.query.workspaceMembers,
        findFirst: vi.fn().mockResolvedValue(mockMembership),
      };

      const result = await storage.findMembershipById(1, 9);

      expect(result).toEqual(mockMembership);
      expect(mockDb.query.workspaceMembers.findFirst).toHaveBeenCalled();
    });
  });

  describe("removeMemberById", () => {
    it("특정 워크스페이스의 멤버를 삭제한다", async () => {
      await storage.removeMemberById(1, 9);

      expect(mockDb.delete).toHaveBeenCalledWith(workspaceMembers);
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});
