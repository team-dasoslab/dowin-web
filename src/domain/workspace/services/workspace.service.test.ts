import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("WorkspaceService", () => {
  const mockStorage = {
    findWorkspaceById: vi.fn(),
    findUserWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspaceName: vi.fn(),
    addMember: vi.fn(),
    findMembershipById: vi.fn(),
    findMembership: vi.fn(),
    findMembers: vi.fn(),
    removeMemberById: vi.fn(),
  };

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

  describe("updateWorkspaceName", () => {
    it("기존 워크스페이스 이름을 수정해 반환한다", async () => {
      const mockWorkspace = {
        id: 1,
        name: "기존 이름",
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
      };
      const updatedWorkspace = {
        ...mockWorkspace,
        name: "새 이름",
      };

      mockStorage.findWorkspaceById.mockResolvedValue(mockWorkspace);
      mockStorage.updateWorkspaceName.mockResolvedValue(updatedWorkspace);

      const result = await service.updateWorkspaceName(1, "새 이름");

      expect(result).toEqual(updatedWorkspace);
      expect(mockStorage.updateWorkspaceName).toHaveBeenCalledWith(1, "새 이름");
    });

    it("워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue(null);

      await expect(service.updateWorkspaceName(1, "새 이름")).rejects.toThrow(
        "NOT_FOUND",
      );
    });
  });

  describe("removeMember", () => {
    it("ADMIN이 다른 멤버를 퇴출할 수 있다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 456,
        role: "MEMBER",
      });

      await service.removeMember(1, 123, 9);

      expect(mockStorage.removeMemberById).toHaveBeenCalledWith(1, 9);
    });

    it("자기 자신을 퇴출하려 하면 403 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(service.removeMember(1, 123, 9)).rejects.toThrow("FORBIDDEN");
    });

    it("대상 멤버가 없으면 404 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue(null);

      await expect(service.removeMember(1, 123, 9)).rejects.toThrow("NOT_FOUND");
    });

    it("마지막 ADMIN은 퇴출할 수 없다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 456,
        role: "ADMIN",
      });
      mockStorage.findMembers.mockResolvedValue([
        { userId: 456, role: "ADMIN" },
      ]);

      await expect(service.removeMember(1, 123, 9)).rejects.toThrow(
        "CANNOT_REMOVE_LAST_ADMIN",
      );
    });
  });
});
