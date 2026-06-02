import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { MarketingInviteStorage } from "@/domain/marketing-invite/storage/marketing-invite.storage";
import {
  normalizeMarketingInviteCode,
  normalizeNullableText,
} from "@/domain/marketing-invite/validation";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { customAlphabet } from "nanoid";

type MarketingInviteStoragePort = Pick<
  MarketingInviteStorage,
  | "listCodes"
  | "findCodeById"
  | "findCodeByCode"
  | "findCodeDetail"
  | "createCode"
  | "updateCode"
  | "findRedemptionByCodeAndUser"
  | "findMembershipByUserId"
  | "updateRedemptionFeedback"
  | "redeemCodeForWorkspace"
>;
type AuditLogPort = Pick<AuditLogStorage, "create">;
type MarketingInviteCode = NonNullable<
  Awaited<ReturnType<MarketingInviteStorage["findCodeById"]>>
>;
type MarketingInviteCodeDetail = NonNullable<
  Awaited<ReturnType<MarketingInviteStorage["findCodeDetail"]>>
>;
type MarketingInviteRedemption = NonNullable<
  Awaited<ReturnType<MarketingInviteStorage["updateRedemptionFeedback"]>>
>;

const generateMarketingInviteCode = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZ",
  12,
);

export class MarketingInviteService {
  constructor(
    private storage: MarketingInviteStoragePort,
    private auditLogStorage: AuditLogPort,
  ) {}

  async listCodes(): Promise<MarketingInviteCode[]> {
    return await this.storage.listCodes();
  }

  async getCodeDetail(id: number): Promise<MarketingInviteCodeDetail> {
    const detail = await this.storage.findCodeDetail(id);
    if (!detail) {
      throw new NotFoundError("NOT_FOUND");
    }
    return detail;
  }

  async createCode(
    adminUserId: number,
    input: {
      code?: string;
      campaignName: string;
      description?: string | null;
      maxUses: number;
      grantedSeatCount: number;
    },
  ): Promise<MarketingInviteCodeDetail> {
    const created = await this.createCodeWithRetry({
      code: input.code ? normalizeMarketingInviteCode(input.code) : undefined,
      campaignName: input.campaignName.trim(),
      description: normalizeNullableText(input.description),
      maxUses: input.maxUses,
      grantedSeatCount: input.grantedSeatCount,
      createdByAdminUserId: adminUserId,
    });

    await this.auditLogStorage.create({
      actorType: "ADMIN",
      actorAdminUserId: adminUserId,
      entityType: "MARKETING_INVITE_CODE",
      entityId: created.id,
      actionType: "CREATE",
      metadata: JSON.stringify({
        domain: "MARKETING_INVITE",
        campaignName: created.campaignName,
        maxUses: created.maxUses,
        grantedSeatCount: created.grantedSeatCount,
      }),
    });

    return await this.getCodeDetail(created.id);
  }

  async updateCode(
    adminUserId: number,
    id: number,
    input: {
      campaignName?: string;
      description?: string | null;
      maxUses?: number;
      grantedSeatCount?: number;
      status?: "ACTIVE" | "INACTIVE";
    },
  ): Promise<MarketingInviteCodeDetail> {
    const existing = await this.storage.findCodeById(id);
    if (!existing) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (input.maxUses !== undefined && input.maxUses < existing.usedCount) {
      throw new ConflictError("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
    }

    const updated = await this.storage.updateCode(id, {
      ...(input.campaignName !== undefined
        ? { campaignName: input.campaignName.trim() }
        : {}),
      ...(input.description !== undefined
        ? { description: normalizeNullableText(input.description) }
        : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.grantedSeatCount !== undefined
        ? { grantedSeatCount: input.grantedSeatCount }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.auditLogStorage.create({
      actorType: "ADMIN",
      actorAdminUserId: adminUserId,
      entityType: "MARKETING_INVITE_CODE",
      entityId: id,
      actionType: "UPDATE",
      metadata: JSON.stringify({
        domain: "MARKETING_INVITE",
        previous: snapshotInviteCode(existing),
        next: snapshotInviteCode(updated),
      }),
    });

    return await this.getCodeDetail(id);
  }

  async updateRedemptionFeedback(
    adminUserId: number,
    redemptionId: number,
    input: {
      feedbackStatus: "NOT_REQUESTED" | "REQUESTED" | "RECEIVED" | "DROPPED";
      operatorNote?: string | null;
    },
  ): Promise<MarketingInviteRedemption> {
    const updated = await this.storage.updateRedemptionFeedback(redemptionId, {
      feedbackStatus: input.feedbackStatus,
      operatorNote: normalizeNullableText(input.operatorNote),
    });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.auditLogStorage.create({
      actorType: "ADMIN",
      actorAdminUserId: adminUserId,
      workspaceId: updated.workspaceId,
      entityType: "MARKETING_INVITE_REDEMPTION",
      entityId: redemptionId,
      actionType: "UPDATE",
      metadata: JSON.stringify({
        domain: "MARKETING_INVITE",
        feedbackStatus: updated.feedbackStatus,
        hasOperatorNote: Boolean(updated.operatorNote),
      }),
    });

    return updated;
  }

  async redeemCode(
    userId: number,
    input: { code: string; workspaceName: string },
  ): Promise<{ workspaceId: string }> {
    const existingMembership = await this.storage.findMembershipByUserId(userId);
    if (existingMembership) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

    const normalizedCode = normalizeMarketingInviteCode(input.code);
    const code = await this.storage.findCodeByCode(normalizedCode);

    if (!code) {
      throw new NotFoundError("INVALID_INVITE_CODE");
    }

    if (code.status !== "ACTIVE") {
      throw new ConflictError("BETA_PROMOTION_CODE_INACTIVE");
    }

    if (code.usedCount >= code.maxUses) {
      throw new ConflictError("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
    }

    const existingRedemption = await this.storage.findRedemptionByCodeAndUser({
      codeId: code.id,
      userId,
    });
    if (existingRedemption) {
      throw new ConflictError("BETA_PROMOTION_CODE_ALREADY_USED");
    }

    const redeemed = await this.storage.redeemCodeForWorkspace({
      code,
      userId,
      workspaceName: input.workspaceName.trim(),
      now: new Date(),
    });

    if (!redeemed) {
      const latestCode = await this.storage.findCodeById(code.id);
      if (!latestCode || latestCode.status !== "ACTIVE") {
        throw new ConflictError("BETA_PROMOTION_CODE_INACTIVE");
      }
      if (latestCode.usedCount >= latestCode.maxUses) {
        throw new ConflictError("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
      }
      throw new ConflictError("BETA_PROMOTION_CODE_USAGE_LIMIT_REACHED");
    }

    await this.auditLogStorage.create({
      actorType: "USER",
      actorUserId: userId,
      workspaceId: redeemed.redemption.workspaceId,
      entityType: "MARKETING_INVITE_REDEMPTION",
      entityId: redeemed.redemption.id,
      actionType: "CREATE",
      metadata: JSON.stringify({
        domain: "MARKETING_INVITE",
        marketingInviteCodeId: code.id,
        campaignName: code.campaignName,
        grantedSeatCount: code.grantedSeatCount,
        entitlementSource: "BETA_PROMOTIONAL_GRANT",
      }),
    });

    return { workspaceId: redeemed.workspaceUid };
  }

  private async createCodeWithRetry(input: {
    code?: string;
    campaignName: string;
    description: string | null;
    maxUses: number;
    grantedSeatCount: number;
    createdByAdminUserId: number;
  }): Promise<MarketingInviteCode> {
    if (input.code) {
      try {
        return await this.storage.createCode({
          ...input,
          code: input.code,
        });
      } catch (error) {
        if (isMarketingInviteCodeUniqueViolation(error)) {
          throw new ConflictError("BETA_PROMOTION_CODE_ALREADY_EXISTS");
        }
        throw error;
      }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.storage.createCode({
          ...input,
          code: generateMarketingInviteCode(),
        });
      } catch (error) {
        if (!isMarketingInviteCodeUniqueViolation(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  }
}

function snapshotInviteCode(code: MarketingInviteCode) {
  return {
    id: code.id,
    campaignName: code.campaignName,
    description: code.description,
    maxUses: code.maxUses,
    usedCount: code.usedCount,
    grantedSeatCount: code.grantedSeatCount,
    status: code.status,
  };
}

function isMarketingInviteCodeUniqueViolation(error: unknown) {
  const messages = collectErrorMessages(error);

  return messages.some(
    (message) =>
      message.includes("marketing_invite_codes_code_unique") ||
      message.includes("marketing_invite_codes.code"),
  );
}

function collectErrorMessages(error: unknown): string[] {
  if (!(error instanceof Error)) {
    return [];
  }

  const messages = [error.message];
  const cause = "cause" in error ? error.cause : undefined;
  if (cause instanceof Error) {
    messages.push(...collectErrorMessages(cause));
  }
  return messages;
}
