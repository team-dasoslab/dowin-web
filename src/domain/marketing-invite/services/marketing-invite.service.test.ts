import { MarketingInviteService } from "@/domain/marketing-invite/services/marketing-invite.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("MarketingInviteService", () => {
  const mockStorage = {
    listCodes: vi.fn(),
    findCodeById: vi.fn(),
    findCodeByCode: vi.fn(),
    findCodeDetail: vi.fn(),
    createCode: vi.fn(),
    updateCode: vi.fn(),
    findRedemptionByCodeAndUser: vi.fn(),
    updateRedemptionFeedback: vi.fn(),
    redeemCodeForWorkspace: vi.fn(),
  };
  const mockAuditLogStorage = {
    create: vi.fn(),
  };
  const service = new MarketingInviteService(
    mockStorage,
    mockAuditLogStorage,
  );

  const activeCode = {
    id: 7,
    code: "BETA2026",
    campaignName: "2026 beta",
    description: null,
    maxUses: 10,
    usedCount: 2,
    grantedSeatCount: 10,
    entitlementSource: "BETA_PROMOTIONAL_GRANT",
    status: "ACTIVE",
    createdByAdminUserId: 1,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCode", () => {
    it("운영자가 영구 무료 혜택 코드를 생성하고 audit log를 남긴다", async () => {
      mockStorage.createCode.mockResolvedValue(activeCode);
      mockStorage.findCodeDetail.mockResolvedValue({
        ...activeCode,
        redemptions: [],
      });

      const result = await service.createCode(1, {
        code: "beta2026",
        campaignName: "2026 beta",
        description: "초기 팀",
        maxUses: 10,
        grantedSeatCount: 10,
      });

      expect(mockStorage.createCode).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "BETA2026",
          campaignName: "2026 beta",
          description: "초기 팀",
          maxUses: 10,
          grantedSeatCount: 10,
          createdByAdminUserId: 1,
        }),
      );
      expect(mockAuditLogStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: "ADMIN",
          actorAdminUserId: 1,
          entityType: "MARKETING_INVITE_CODE",
          entityId: 7,
          actionType: "CREATE",
        }),
      );
      expect(result.redemptions).toEqual([]);
    });
  });

  describe("updateCode", () => {
    it("maxUses를 usedCount보다 작게 낮추면 막는다", async () => {
      mockStorage.findCodeById.mockResolvedValue(activeCode);

      await expect(
        service.updateCode(1, 7, { maxUses: 1 }),
      ).rejects.toThrow("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
      expect(mockStorage.updateCode).not.toHaveBeenCalled();
    });
  });

  describe("redeemCode", () => {
    it("활성 코드로 워크스페이스를 생성하고 workspaceId를 반환한다", async () => {
      mockStorage.findCodeByCode.mockResolvedValue(activeCode);
      mockStorage.findRedemptionByCodeAndUser.mockResolvedValue(null);
      mockStorage.redeemCodeForWorkspace.mockResolvedValue({
        workspaceUid: "ws_beta",
        redemption: {
          id: 11,
          marketingInviteCodeId: activeCode.id,
          redeemedByUserId: 123,
          workspaceId: 5,
          redeemedAt: new Date("2026-06-02T00:00:00.000Z"),
          feedbackStatus: "NOT_REQUESTED",
          acquisitionSource: "MARKETING_INVITE",
          campaignName: activeCode.campaignName,
          operatorNote: null,
        },
      });

      const result = await service.redeemCode(123, {
        code: " beta2026 ",
        workspaceName: "Beta Team",
      });

      expect(result).toEqual({ workspaceId: "ws_beta" });
      expect(mockStorage.findCodeByCode).toHaveBeenCalledWith("BETA2026");
      expect(mockStorage.redeemCodeForWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          code: activeCode,
          userId: 123,
          workspaceName: "Beta Team",
        }),
      );
      expect(mockAuditLogStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: "USER",
          actorUserId: 123,
          workspaceId: 5,
          entityType: "MARKETING_INVITE_REDEMPTION",
          entityId: 11,
          actionType: "CREATE",
        }),
      );
    });

    it("존재하지 않는 코드는 INVALID_INVITE_CODE로 막는다", async () => {
      mockStorage.findCodeByCode.mockResolvedValue(null);

      await expect(
        service.redeemCode(123, { code: "UNKNOWN", workspaceName: "Team" }),
      ).rejects.toThrow("INVALID_INVITE_CODE");
    });

    it("비활성 코드는 막는다", async () => {
      mockStorage.findCodeByCode.mockResolvedValue({
        ...activeCode,
        status: "INACTIVE",
      });

      await expect(
        service.redeemCode(123, { code: "BETA2026", workspaceName: "Team" }),
      ).rejects.toThrow("BETA_PROMOTION_CODE_INACTIVE");
    });

    it("사용 횟수 한도에 도달한 코드는 막는다", async () => {
      mockStorage.findCodeByCode.mockResolvedValue({
        ...activeCode,
        usedCount: 10,
      });

      await expect(
        service.redeemCode(123, { code: "BETA2026", workspaceName: "Team" }),
      ).rejects.toThrow("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
    });

    it("같은 사용자가 같은 코드를 중복 사용할 수 없다", async () => {
      mockStorage.findCodeByCode.mockResolvedValue(activeCode);
      mockStorage.findRedemptionByCodeAndUser.mockResolvedValue({
        id: 1,
      });

      await expect(
        service.redeemCode(123, { code: "BETA2026", workspaceName: "Team" }),
      ).rejects.toThrow("BETA_PROMOTION_CODE_ALREADY_USED");
      expect(mockStorage.redeemCodeForWorkspace).not.toHaveBeenCalled();
    });
  });

  describe("updateRedemptionFeedback", () => {
    it("피드백 상태와 운영 메모를 수정하고 audit log를 남긴다", async () => {
      mockStorage.updateRedemptionFeedback.mockResolvedValue({
        id: 11,
        marketingInviteCodeId: 7,
        redeemedByUserId: 123,
        workspaceId: 5,
        redeemedAt: new Date("2026-06-02T00:00:00.000Z"),
        feedbackStatus: "RECEIVED",
        acquisitionSource: "MARKETING_INVITE",
        campaignName: "2026 beta",
        operatorNote: "좋은 피드백",
      });

      const result = await service.updateRedemptionFeedback(1, 11, {
        feedbackStatus: "RECEIVED",
        operatorNote: " 좋은 피드백 ",
      });

      expect(mockStorage.updateRedemptionFeedback).toHaveBeenCalledWith(11, {
        feedbackStatus: "RECEIVED",
        operatorNote: "좋은 피드백",
      });
      expect(mockAuditLogStorage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: "ADMIN",
          actorAdminUserId: 1,
          workspaceId: 5,
          entityType: "MARKETING_INVITE_REDEMPTION",
          entityId: 11,
          actionType: "UPDATE",
        }),
      );
      expect(result.feedbackStatus).toBe("RECEIVED");
    });
  });
});
