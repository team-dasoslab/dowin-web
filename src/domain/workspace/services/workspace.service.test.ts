import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("WorkspaceService", () => {
  const ctx: WorkspaceAccessContext = {
    workspaceId: 1,
    workspacePublicId: "ws_abc",
    workspaceName: "My Workspace",
    userId: 100,
    role: "ADMIN",
    membershipId: 10,
    allowPastDailyLogEdit: false,
    entitlement: {
      canAccessBasicSubscription: true,
      entitlementSource: null,
      billingStatus: "ACTIVE",
      planCode: "BASIC",
    },
    capacity: {
      hasAvailableMemberSlot: true,
      isOverLimit: false,
    },
  };
  const mockStorage = {
    resolveIdByUid: vi.fn(),
    findWorkspaceById: vi.fn(),
    findUserWorkspace: vi.fn(),
    listUserWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    addMember: vi.fn(),
    findMembershipById: vi.fn(),
    findMembership: vi.fn(),
    findMembers: vi.fn(),
    countMembers: vi.fn(),
    findPlanLimit: vi.fn(),
    findBillingState: vi.fn(),
    findSeatEntitlement: vi.fn(),
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
    mockStorage.countMembers.mockResolvedValue(1);
    mockStorage.findPlanLimit.mockResolvedValue({ memberLimit: 10 });
    mockStorage.findMembership.mockResolvedValue({ role: "ADMIN" });
    mockStorage.findBillingState.mockResolvedValue({
      planCode: "BASIC",
      billingStatus: "ACTIVE",
      entitlementSource: "POLAR",
    });
    mockStorage.findSeatEntitlement.mockResolvedValue(null);
  });

  describe("getMyWorkspace", () => {
    it("사용자가 속한 워크스페이스가 있으면 이를 반환한다", async () => {
      const createdAt = new Date("2026-04-01T00:00:00.000Z");
      const mockWorkspace = {
        id: 1,
        uid: "ws_1",
        name: "Workspace",
        planCode: "FREE",
        billingCustomerExternalRef: "workspace-checkout:pending_1",
        billingOwnerUserId: 123,
        createdAt,
      };
      mockStorage.findUserWorkspace.mockResolvedValue(mockWorkspace);

      const result = await service.getMyWorkspace(123);

      expect(result).toEqual({
        id: "ws_1",
        name: "Workspace",
        planCode: "FREE",
        createdAt,
        freeMemberLimit: 10,
        isOverFreeMemberLimit: false,
        memberCount: 1,
        role: "ADMIN",
      });
      expect(result).not.toHaveProperty("billingCustomerExternalRef");
      expect(result).not.toHaveProperty("billingOwnerUserId");
    });

    it("FREE 플랜 멤버 한도 초과 상태를 함께 반환한다", async () => {
      const mockWorkspace = { id: 1, uid: "ws_1", name: "Workspace", planCode: "FREE" };
      mockStorage.findUserWorkspace.mockResolvedValue(mockWorkspace);
      mockStorage.countMembers.mockResolvedValue(11);

      const result = await service.getMyWorkspace(123);

      expect(result).toEqual({
        id: "ws_1",
        name: "Workspace",
        planCode: "FREE",
        freeMemberLimit: 10,
        isOverFreeMemberLimit: true,
        memberCount: 11,
        role: "ADMIN",
      });
    });

    it("좌석 권한이 있으면 purchasedSeatCount 기준으로 초과 상태를 반환한다", async () => {
      const mockWorkspace = { id: 1, uid: "ws_1", name: "Workspace", planCode: "STANDARD" };
      mockStorage.findUserWorkspace.mockResolvedValue(mockWorkspace);
      mockStorage.findSeatEntitlement.mockResolvedValue({
        purchasedSeatCount: 5,
      });
      mockStorage.countMembers.mockResolvedValue(6);

      const result = await service.getMyWorkspace(123);

      expect(result).toEqual({
        id: "ws_1",
        name: "Workspace",
        planCode: "STANDARD",
        freeMemberLimit: 5,
        isOverFreeMemberLimit: true,
        memberCount: 6,
        role: "ADMIN",
      });
    });

    it("현재 워크스페이스의 membership role을 함께 반환한다", async () => {
      const mockWorkspace = {
        id: 1,
        uid: "ws_1",
        name: "Workspace",
        planCode: "FREE",
      };
      mockStorage.findUserWorkspace.mockResolvedValue(mockWorkspace);
      mockStorage.findMembership.mockResolvedValue({ role: "MEMBER" });

      const result = await service.getMyWorkspace(123);

      expect(result.role).toBe("MEMBER");
      expect(mockStorage.findMembership).toHaveBeenCalledWith(1, 123);
    });

    it("사용자가 속한 워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findUserWorkspace.mockResolvedValue(null);

      await expect(service.getMyWorkspace(123)).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("listMyWorkspaces", () => {
    it("현재 워크스페이스 표시와 함께 목록을 반환한다", async () => {
      mockStorage.listUserWorkspaces.mockResolvedValue([
        {
          role: "MEMBER",
          workspace: {
            id: 3,
            uid: "ws_ops",
            name: "운영팀",
            planCode: "STANDARD",
            createdAt: new Date("2026-05-01T00:00:00.000Z"),
          },
        },
        {
          role: "ADMIN",
          workspace: {
            id: 7,
            uid: "ws_personal",
            name: "개인",
            planCode: "FREE",
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
          },
        },
      ]);

      const result = await service.listMyWorkspaces(123, 7);

      expect(result).toEqual([
        expect.objectContaining({
          id: "ws_ops",
          role: "MEMBER",
          isCurrent: false,
        }),
        expect.objectContaining({
          id: "ws_personal",
          role: "ADMIN",
          isCurrent: true,
        }),
      ]);
    });
  });

  describe("createWorkspace", () => {
    it("새 워크스페이스를 생성하고 생성자를 ADMIN으로 추가한다", async () => {
      const mockWorkspace = { id: 1, uid: "ws_new", name: "New", planCode: "FREE" };
      mockStorage.createWorkspace.mockResolvedValue(mockWorkspace);

      const result = await service.createWorkspace(123, "New");

      expect(result).toEqual({
        id: "ws_new",
        name: "New",
        planCode: "FREE",
      });
      expect(mockStorage.createWorkspace).toHaveBeenCalledWith("New");
      expect(mockStorage.addMember).toHaveBeenCalledWith(1, 123, "ADMIN");
    });

    it("멤버 추가 중 유니크 충돌이 발생하면 409 에러를 던진다", async () => {
      mockStorage.createWorkspace.mockResolvedValue({
        id: 1,
        name: "New",
        planCode: "FREE",
      });
      mockStorage.addMember.mockRejectedValue(
        new Error(
          "UNIQUE constraint failed: workspace_members.workspace_id, workspace_members.user_id",
        ),
      );

      await expect(service.createWorkspace(123, "New")).rejects.toThrow("ALREADY_IN_WORKSPACE");
    });
  });

  describe("joinWorkspace", () => {
    it("워크스페이스에 사용자를 MEMBER로 추가한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(9);
      mockStorage.addMember.mockResolvedValue(undefined);
      await service.joinWorkspace(1, 123);

      expect(mockStorage.addMember).toHaveBeenCalledWith(1, 123, "MEMBER");
    });

    it("대상 워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue(null);

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("NOT_FOUND");
    });

    it("동시 요청으로 유니크 충돌이 발생하면 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(9);
      mockStorage.addMember.mockRejectedValue(
        new Error(
          "UNIQUE constraint failed: workspace_members.workspace_id, workspace_members.user_id",
        ),
      );

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("ALREADY_IN_WORKSPACE");
    });

    it("멤버 수 제한에 도달하면 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(10);

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("WORKSPACE_MEMBER_LIMIT_REACHED");
      expect(mockStorage.addMember).not.toHaveBeenCalled();
    });

    it("Basic entitlement가 없으면 워크스페이스 참가를 막는다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.findBillingState.mockResolvedValue(null);

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("BASIC_SUBSCRIPTION_REQUIRED");
      expect(mockStorage.addMember).not.toHaveBeenCalled();
    });

    it("좌석 권한이 있으면 플랜이 아니라 purchasedSeatCount 기준으로 참가를 막는다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "STANDARD",
      });
      mockStorage.findSeatEntitlement.mockResolvedValue({
        purchasedSeatCount: 3,
      });
      mockStorage.countMembers.mockResolvedValue(3);

      await expect(service.joinWorkspace(1, 123)).rejects.toThrow("WORKSPACE_MEMBER_LIMIT_REACHED");
      expect(mockStorage.addMember).not.toHaveBeenCalled();
    });
  });

  describe("updateWorkspace", () => {
    it("기존 워크스페이스 이름을 수정해 반환한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        uid: "ws_1",
        name: "기존 이름",
        planCode: "FREE",
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
      } as unknown as NonNullable<Awaited<ReturnType<typeof mockStorage.findWorkspaceById>>>);

      const updatedWorkspace = {
        id: 1,
        uid: "ws_1",
        name: "새 이름",
        planCode: "FREE",
        allowPastDailyLogEdit: false,
        createdAt: new Date("2026-03-18T00:00:00.000Z"),
      };
      mockStorage.updateWorkspace.mockResolvedValue(updatedWorkspace);

      const result = await service.updateWorkspace(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        { name: "새 이름" },
      );

      expect(result).toEqual({
        id: "ws_1",
        name: "새 이름",
        planCode: "FREE",
        allowPastDailyLogEdit: false,
        createdAt: expect.any(Date),
      });
      expect(mockStorage.updateWorkspace).toHaveBeenCalledWith(1, { name: "새 이름" });
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

      await service.removeMember(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        9,
      );

      expect(mockStorage.removeMemberById).toHaveBeenCalledWith(1, 9);
    });

    it("자기 자신을 퇴출하려 하면 403 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(
        service.removeMember(
          {
            workspaceId: 1,
            userId: 123,
            role: "ADMIN",
            entitlement: { planCode: "BASIC" },
          } as unknown as WorkspaceAccessContext,
          9,
        ),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("대상 멤버가 없으면 404 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue(null);

      await expect(
        service.removeMember(
          {
            workspaceId: 1,
            userId: 123,
            role: "ADMIN",
            entitlement: { planCode: "BASIC" },
          } as unknown as WorkspaceAccessContext,
          9,
        ),
      ).rejects.toThrow("NOT_FOUND");
    });

    it("마지막 ADMIN은 퇴출할 수 없다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 456,
        role: "ADMIN",
      });
      mockStorage.findMembers.mockResolvedValue([{ userId: 456, role: "ADMIN" }]);

      await expect(
        service.removeMember(
          {
            workspaceId: 1,
            userId: 123,
            role: "ADMIN",
            entitlement: { planCode: "BASIC" },
          } as unknown as WorkspaceAccessContext,
          9,
        ),
      ).rejects.toThrow("CANNOT_REMOVE_LAST_ADMIN");
    });
  });

  describe("invite", () => {
    it("ADMIN이 초대코드를 생성한다", async () => {
      const workspace = {
        id: 1,
        name: "팀",
        planCode: "FREE",
        createdAt: new Date(),
      };
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

      const invite = await service.createInvite(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        3,
      );
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
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        uid: "ws_team",
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(9);
      mockStorage.addMemberByInvite.mockResolvedValue(true);

      const result = await service.joinWorkspaceByInvite("abcd123456", 7);

      expect(mockStorage.addMemberByInvite).toHaveBeenCalledWith({
        inviteId: 11,
        workspaceId: 1,
        userId: 7,
      });
      expect(result.id).toBe("ws_team");
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
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(9);
      mockStorage.addMemberByInvite.mockRejectedValue(
        new Error(
          "UNIQUE constraint failed: workspace_members.workspace_id, workspace_members.user_id",
        ),
      );

      await expect(service.joinWorkspaceByInvite("ABCD123456", 7)).rejects.toThrow(
        "ALREADY_IN_WORKSPACE",
      );
    });

    it("FREE 플랜 멤버 수 제한에 도달하면 초대코드 참가를 막는다", async () => {
      mockStorage.findInviteByCode.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        code: "ABCD123456",
        maxUses: 3,
        usedCount: 1,
        status: "ACTIVE",
      });
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.countMembers.mockResolvedValue(10);

      await expect(service.joinWorkspaceByInvite("ABCD123456", 7)).rejects.toThrow(
        "WORKSPACE_MEMBER_LIMIT_REACHED",
      );
      expect(mockStorage.addMemberByInvite).not.toHaveBeenCalled();
    });
  });

  describe("tags", () => {
    it("워크스페이스 태그 목록을 반환한다", async () => {
      const tags = [
        { id: 1, workspaceId: 1, name: "운동", normalizedName: "운동" },
        { id: 2, workspaceId: 1, name: "건강", normalizedName: "건강" },
      ];
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "BASIC",
      });
      mockStorage.listTags.mockResolvedValue(tags);

      const result = await service.listTags({
        workspaceId: 1,
        userId: 1,
        role: "ADMIN",
        entitlement: { planCode: "BASIC" },
      } as unknown as WorkspaceAccessContext);

      expect(result).toEqual(tags);
      expect(mockStorage.listTags).toHaveBeenCalledWith(1);
    });

    it("태그를 생성한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.createTag.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
        createdByUserId: 7,
      });

      const result = await service.createTag(
        {
          workspaceId: 1,
          userId: 7,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        {
          name: "운동",
          normalizedName: "운동",
        },
      );

      expect(result.name).toBe("운동");
      expect(mockStorage.createTag).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          name: "운동",
          normalizedName: "운동",
          createdByUserId: 7,
        }),
      );
    });

    it("같은 이름의 태그가 이미 있으면 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.createTag.mockRejectedValue(
        new Error("UNIQUE constraint failed: workspace_tags_workspace_normalized_name_unique"),
      );

      await expect(
        service.createTag(ctx, {
          name: "운동",
          normalizedName: "운동",
        }),
      ).rejects.toThrow("WORKSPACE_TAG_ALREADY_EXISTS");
    });

    it("D1 cause에 유니크 충돌이 들어와도 409 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      const wrappedError = new Error("Failed query");
      wrappedError.cause = new Error(
        "UNIQUE constraint failed: workspace_tags.workspace_id, workspace_tags.normalized_name: SQLITE_CONSTRAINT",
      );
      mockStorage.createTag.mockRejectedValue(wrappedError);

      await expect(
        service.createTag(ctx, {
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

      const result = await service.updateTag(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        10,
        {
          name: "깊은 일",
          normalizedName: "깊은 일",
        },
      );

      expect(result.name).toBe("깊은 일");
      expect(mockStorage.updateTag).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ name: "깊은 일", normalizedName: "깊은 일" }),
      );
    });

    it("태그를 삭제한다", async () => {
      mockStorage.findTagById.mockResolvedValue({
        id: 10,
        workspaceId: 1,
        name: "운동",
        normalizedName: "운동",
      });

      await service.deleteTag(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        10,
      );

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

      await service.leaveWorkspace({
        workspaceId: 1,
        userId: 1,
        role: "ADMIN",
        entitlement: { planCode: "BASIC" },
      } as unknown as WorkspaceAccessContext);

      expect(mockStorage.removeMemberById).toHaveBeenCalledWith(1, 9);
    });

    it("ADMIN은 권한 이전 또는 삭제 없이 탈퇴할 수 없다", async () => {
      mockStorage.findMembership.mockResolvedValue({
        id: 9,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(
        service.leaveWorkspace({
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext),
      ).rejects.toThrow("ADMIN_TRANSFER_REQUIRED");
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

      await service.transferAdmin(
        {
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext,
        11,
      );

      expect(mockStorage.transferAdmin).toHaveBeenCalledWith(1, 1, 456);
    });

    it("자기 자신에게 권한을 이전할 수 없다", async () => {
      mockStorage.findMembershipById.mockResolvedValue({
        id: 11,
        workspaceId: 1,
        userId: 123,
        role: "ADMIN",
      });

      await expect(
        service.transferAdmin(
          {
            workspaceId: 1,
            userId: 123,
            role: "ADMIN",
            entitlement: { planCode: "BASIC" },
          } as unknown as WorkspaceAccessContext,
          11,
        ),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("대상 멤버가 없으면 404 에러를 던진다", async () => {
      mockStorage.findMembershipById.mockResolvedValue(null);

      await expect(
        service.transferAdmin(
          {
            workspaceId: 1,
            userId: 123,
            role: "ADMIN",
            entitlement: { planCode: "BASIC" },
          } as unknown as WorkspaceAccessContext,
          11,
        ),
      ).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("deleteWorkspace", () => {
    it("워크스페이스를 soft delete한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "FREE",
      });
      mockStorage.findBillingState.mockResolvedValue(null);

      await service.deleteWorkspace({
        workspaceId: 1,
        userId: 1,
        role: "ADMIN",
        entitlement: { planCode: "BASIC" },
      } as unknown as WorkspaceAccessContext);

      expect(mockStorage.deleteWorkspace).toHaveBeenCalledWith(1);
    });

    it("활성 Polar 구독이 있으면 삭제를 막는다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "BASIC",
      });
      mockStorage.findBillingState.mockResolvedValue({
        provider: "POLAR",
        billingStatus: "ACTIVE",
        entitlementSource: "POLAR",
        currentPeriodEnd: null,
      });

      await expect(
        service.deleteWorkspace({
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext),
      ).rejects.toThrow("WORKSPACE_ACTIVE_SUBSCRIPTION_DELETE_FORBIDDEN");
      expect(mockStorage.deleteWorkspace).not.toHaveBeenCalled();
    });

    it("취소된 Polar 구독은 이용 기간이 남아도 soft delete를 허용한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "BASIC",
      });
      mockStorage.findBillingState.mockResolvedValue({
        provider: "POLAR",
        billingStatus: "CANCELED",
        entitlementSource: "POLAR",
        currentPeriodEnd: new Date("2026-06-10T00:00:00.000Z"),
      });

      await service.deleteWorkspace({
        workspaceId: 1,
        userId: 1,
        role: "ADMIN",
        entitlement: { planCode: "BASIC" },
      } as unknown as WorkspaceAccessContext);

      expect(mockStorage.deleteWorkspace).toHaveBeenCalledWith(1);
    });

    it("기간이 끝난 취소 Polar 구독은 soft delete를 허용한다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue({
        id: 1,
        name: "팀",
        planCode: "BASIC",
      });
      mockStorage.findBillingState.mockResolvedValue({
        provider: "POLAR",
        billingStatus: "CANCELED",
        entitlementSource: "POLAR",
        currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      });

      await service.deleteWorkspace({
        workspaceId: 1,
        userId: 1,
        role: "ADMIN",
        entitlement: { planCode: "BASIC" },
      } as unknown as WorkspaceAccessContext);

      expect(mockStorage.deleteWorkspace).toHaveBeenCalledWith(1);
    });

    it("워크스페이스가 없으면 404 에러를 던진다", async () => {
      mockStorage.findWorkspaceById.mockResolvedValue(null);

      await expect(
        service.deleteWorkspace({
          workspaceId: 1,
          userId: 1,
          role: "ADMIN",
          entitlement: { planCode: "BASIC" },
        } as unknown as WorkspaceAccessContext),
      ).rejects.toThrow("NOT_FOUND");
    });
  });
});
