import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { ADMIN_SESSION_TTL_MS } from "@/domain/admin/constants";
import { AdminAuthStorage } from "@/domain/admin/storage/admin-auth.storage";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";

type AdminRole =
  | "SUPPORT_ADMIN"
  | "BILLING_ADMIN"
  | "RECOVERY_ADMIN"
  | "SYSTEM_ADMIN";

export interface AdminAuthStoragePort {
  findAdminUserByLoginId: AdminAuthStorage["findAdminUserByLoginId"];
  findAdminUserById: AdminAuthStorage["findAdminUserById"];
  listActiveRolesByAdminUserId: AdminAuthStorage["listActiveRolesByAdminUserId"];
  createAdminSession: AdminAuthStorage["createAdminSession"];
  updateAdminUserLastLoginAt: AdminAuthStorage["updateAdminUserLastLoginAt"];
}

export class AdminAuthService {
  constructor(private storage: AdminAuthStoragePort) {}

  async login(
    loginId: string,
    password: string,
    metadata?: {
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ) {
    const adminUser = await this.storage.findAdminUserByLoginId(loginId);

    if (!adminUser) {
      throw new UnauthorizedError("INVALID_CREDENTIALS");
    }

    if (adminUser.status !== "ACTIVE") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const isPasswordMatch = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isPasswordMatch) {
      throw new UnauthorizedError("INVALID_CREDENTIALS");
    }

    const rawSessionToken = nanoid(48);
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    const lastLoginAt = new Date();

    await this.storage.createAdminSession({
      id: nanoid(),
      adminUserId: adminUser.id,
      sessionTokenHash: hashAdminSessionToken(rawSessionToken),
      expiresAt,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    });

    await this.storage.updateAdminUserLastLoginAt(adminUser.id, lastLoginAt);

    const roles = await this.storage.listActiveRolesByAdminUserId(adminUser.id);

    return {
      adminUser: {
        id: adminUser.id,
        loginId: adminUser.loginId,
        displayName: adminUser.displayName,
        status: adminUser.status,
        mfaEnabled: adminUser.mfaEnabled,
        lastLoginAt,
      },
      roles,
      sessionToken: rawSessionToken,
      expiresAt,
    };
  }

  async getSessionProfile(adminUserId: number) {
    const adminUser = await this.storage.findAdminUserById(adminUserId);

    if (!adminUser || adminUser.status !== "ACTIVE") {
      throw new UnauthorizedError("UNAUTHORIZED");
    }

    const roles = await this.storage.listActiveRolesByAdminUserId(adminUserId);

    return {
      adminUser: {
        id: adminUser.id,
        loginId: adminUser.loginId,
        displayName: adminUser.displayName,
        status: adminUser.status,
        mfaEnabled: adminUser.mfaEnabled,
        lastLoginAt: adminUser.lastLoginAt,
      },
      roles: roles as AdminRole[],
    };
  }
}

function hashAdminSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}
