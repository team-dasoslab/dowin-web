import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("WorkspaceService", () => {
  const mockStorage = {
    findUserWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    addMember: vi.fn(),
    findMembers: vi.fn(),
  } as any;

  const service = new WorkspaceService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyWorkspace", () => {
    it("사용자가 속한 워크스페이스가 있으면 이를 반환한다", async () => {
      const mockWorkspace = { id: 1, name: "Workspace" };
      mockStorage.findUserWorkspace.mockResolvedValue(mockWorkspace);

      const result = await service.getMyWorkspace(123);

      expect(result).toEqual(mockWorkspace);
    });

    it("사용자가 속한 워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findUserWorkspace.mockResolvedValue(null);

      await expect(service.getMyWorkspace(123)).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("createWorkspace", () => {
    it("새 워크스페이스를 생성하고 생성자를 ADMIN으로 추가한다", async () => {
      const mockWorkspace = { id: 1, name: "New" };
      mockStorage.createWorkspace.mockResolvedValue(mockWorkspace);

      const result = await service.createWorkspace(123, "New");

      expect(result).toEqual(mockWorkspace);
      expect(mockStorage.createWorkspace).toHaveBeenCalledWith("New");
      expect(mockStorage.addMember).toHaveBeenCalledWith(1, 123, "ADMIN");
    });
  });

  describe("joinWorkspace", () => {
    it("워크스페이스에 사용자를 MEMBER로 추가한다", async () => {
      await service.joinWorkspace(1, 123);

      expect(mockStorage.addMember).toHaveBeenCalledWith(1, 123, "MEMBER");
    });
  });
});
