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
    updateMemberRole: vi.fn(),
    transferAdmin: vi.fn(),
    deleteWorkspace: vi.fn(),
    createInvite: vi.fn(),
    findInviteByCode: vi.fn(),
    findInviteById: vi.fn(),
    listInvites: vi.fn(),
    updateInviteStatus: vi.fn(),
    addMemberByInvite: vi.fn(),
    listTags: vi.fn(),
    findTagById: vi.fn(),
    findTagsByIds: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
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

  describe("tags", () => {
    it("워크스페이스 태그 목록을 반환한다", async () => {
      const tags = [
        { id: 1, workspaceId: 1, name: "운동", normalizedName: "운동" },
        { id: 2, workspaceId: 1, name: "건강", normalizedName: "건강" },
      ];
      mockStorage.listTags.mockResolvedValue(tags);

      const result = await service.listTags(1);

      expect(result).toEqual(tags);
      expect(mockStorage.listTags).toHaveBeenCalledWith(1);
    });

    it("태그를 생성한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });
      mockStorage.createTag.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
        createdByUserId: 7,
      });

      const result = await service.createTag(1, 7, {
        name: "운동",
        normalizedName: "운동",
      });

      expect(result.name).toBe("운동");
      expect(mockStorage.createTag).toHaveBeenCalledWith({
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
        createdByUserId: 7,
      });
    });

    it("같은 이름의 태그가 이미 있으면 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });
      mockStorage.createTag.mockRejectedValue(
        new Error(
          "UNIQUE constraint failed: workspace_tags_workspace_normalized_name_unique",
        ),
      );

      await expect(
        service.createTag(1, 7, {
          name: "운동",
          normalizedName: "운동",
        }),
      ).rejects.toThrow("WORKSPACE_TAG_ALREADY_EXISTS");
    });

    it("D1 cause에 유니크 충돌이 들어와도 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });
      const wrappedError = new Error("Failed query");
      wrappedError.cause = new Error(
        "UNIQUE constraint failed: workspace_tags.workspace_id, workspace_tags.normalized_name: SQLITE_CONSTRAINT",
      );
      mockStorage.createTag.mockRejectedValue(wrappedError);

      await expect(
        service.createTag(1, 7, {
          name: "운동",
          normalizedName: "운동",
        }),
      ).rejects.toThrow("WORKSPACE_TAG_ALREADY_EXISTS");
    });

    it("태그 이름을 수정한다", async () => {
      mockStorage.findTagById.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
      });
      mockStorage.updateTag.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "깊은 일",
        normalizedName: "깊은 일",
      });

      const result = await service.updateTag(1, 10, {
        name: "깊은 일",
        normalizedName: "깊은 일",
      });

      expect(result.name).toBe("깊은 일");
      expect(mockStorage.updateTag).toHaveBeenCalledWith(1, 10, {
        name: "깊은 일",
        normalizedName: "깊은 일",
      });
    });

    it("태그를 삭제한다", async () => {
      mockStorage.findTagById.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
      });

      await service.deleteTag(1, 10);

      expect(mockStorage.deleteTag).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("leaveWorkspace", () => {
    it("MEMBER는 워크스페이스를 탈퇴할 수 있다", async () => {
      mockStorage.findMembership.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 123,
        role: "MEMBER",
      });

      await service.leaveWorkspace(1, 123);

      expect(mockStorage.removeMemberById).toHaveBeenCalledWith(1, 9);
    });

    it("ADMIN은 권한 이전 또는 삭제 없이 탈퇴할 수 없다", async () => {
      mockStorage.findMembership.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(service.leaveWorkspace(1, 123)).rejects.toThrow(
        "ADMIN_TRANSFER_REQUIRED",
      );
    });
  });

  describe("transferAdmin", () => {
    it("ADMIN 권한을 다른 멤버에게 이전한다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        userId: 456,
        role: "MEMBER",
      });

      await service.transferAdmin(1, 123, 11);

      expect(mockStorage.transferAdmin).toHaveBeenCalledWith(1, 123, 456);
    });

    it("자기 자신에게 권한을 이전할 수 없다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(service.transferAdmin(1, 123, 11)).rejects.toThrow(
        "FORBIDDEN",
      );
    });

    it("대상 멤버가 없으면 404 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue(null);

      await expect(service.transferAdmin(1, 123, 11)).rejects.toThrow(
        "NOT_FOUND",
      );
    });
  });

  describe("deleteWorkspace", () => {
    it("워크스페이스를 삭제한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({ id: 1, name: "팀" });

      await service.deleteWorkspace(1);

      expect(mockStorage.deleteWorkspace).toHaveBeenCalledWith(1);
    });

    it("워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue(null);

      await expect(service.deleteWorkspace(1)).rejects.toThrow("NOT_FOUND");
    });
  });
});
