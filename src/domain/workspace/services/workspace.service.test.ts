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
    createInvite: vi.fn(),
    findInviteByCode: vi.fn(),
    findInviteById: vi.fn(),
    listInvites: vi.fn(),
    updateInviteStatus: vi.fn(),
    addMemberByInvite: vi.fn(),
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

    it("멤버 추가 중 유니크 충돌이 발생하면 409 에러를 던진다", async () => {
      mockStorage.createWorkspace.mockResolvedValue({ id: 1, name: "New" });
      mockStorage.addMember.mockRejectedValue(
        new Error("UNIQUE constraint failed: workspace_members.user_id"),
      );

      await expect(service.createWorkspace(123, "New")).rejects.toThrow(
        "ALREADY_IN_WORKSPACE",
      );
    });
  });

  describe("joinWorkspace", () => {
    it("워크스페이스에 사용자를 MEMBER로 추가한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });
      mockStorage.addMember.mockResolvedValue(undefined);
      await service.joinWorkspace(1, 123);

      expect(mockStorage.addMember).toHaveBeenCalledWith(1, 123, "MEMBER");
    });

    it("대상 워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue(null);

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("NOT_FOUND");
    });

    it("동시 요청으로 유니크 충돌이 발생하면 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });
      mockStorage.addMember.mockRejectedValue(
        new Error("UNIQUE constraint failed: workspace_members.user_id"),
      );

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow(
        "ALREADY_IN_WORKSPACE",
      );
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

  describe("invite", () => {
    it("ADMIN이 초대코드를 생성한다", async () => {
      const workspace = { id: 1, name: "팀", createdAt: new Date() };
      mockStorage.findWorkspaceById.mockResolvedValue(workspace);
      mockStorage.createInvite.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        code: "ABCDEFG234",
        maxUses: 3,
        usedCount: 0,
        status: "ACTIVE",
        createdByUserId: 1,
        createdAt: new Date(),
      });

      const invite = await service.createInvite(1, 1, 3);
      expect(invite.code).toBeDefined();
      expect(mockStorage.createInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          maxUses: 3,
          createdByUserId: 1,
          code: expect.any(String),
        }),
      );
    });

    it("비활성화된 초대코드는 참가할 수 없다", async () => {
      mockStorage.findInviteByCode.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        code: "ABCD123456",
        maxUses: 1,
        usedCount: 0,
        status: "INACTIVE",
      });

      await expect(service.joinWorkspaceByInvite("abcd123456", 7)).rejects.toThrow(
        "INVITE_CODE_INACTIVE",
      );
    });

    it("사용 횟수를 초과한 초대코드는 참가할 수 없다", async () => {
      mockStorage.findInviteByCode.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        code: "ABCD123456",
        maxUses: 1,
        usedCount: 1,
        status: "ACTIVE",
      });

      await expect(service.joinWorkspaceByInvite("ABCD123456", 7)).rejects.toThrow(
        "INVITE_CODE_USAGE_LIMIT_REACHED",
      );
    });

    it("유효한 초대코드면 참가 처리한다", async () => {
      mockStorage.findInviteByCode.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        code: "ABCD123456",
        maxUses: 3,
        usedCount: 1,
        status: "ACTIVE",
      });
      mockStorage.addMemberByInvite.mockResolvedValue(true);

      await service.joinWorkspaceByInvite("abcd123456", 7);

      expect(mockStorage.addMemberByInvite).toHaveBeenCalledWith({
        inviteId: 11,
        workspaceId: 1,
        userId: 7,
      });
    });

    it("초대코드 참가 중 유니크 충돌이 발생하면 409 에러를 던진다", async () => {
      mockStorage.findInviteByCode.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        code: "ABCD123456",
        maxUses: 3,
        usedCount: 1,
        status: "ACTIVE",
      });
      mockStorage.addMemberByInvite.mockRejectedValue(
        new Error("UNIQUE constraint failed: workspace_members.user_id"),
      );

      await expect(service.joinWorkspaceByInvite("ABCD123456", 7)).rejects.toThrow(
        "ALREADY_IN_WORKSPACE",
      );
    });
  });
});
