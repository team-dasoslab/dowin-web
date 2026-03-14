import { beforeEach, describe, expect, it, vi } from "vitest";
import { workspaceMembers, workspaces } from "../../../db/schema";
import { WorkspaceStorage } from "./workspace.storage";

describe("WorkspaceStorage", () => {
  const mockDb = {
    query: {
      workspaces: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  } as any;

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
});
