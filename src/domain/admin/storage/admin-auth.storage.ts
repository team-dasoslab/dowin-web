import { getDb } from "@/db";
import { adminRoleGrants, adminSessions, adminUsers } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export class AdminAuthStorage {
  constructor(private db: ReturnType<typeof getDb>) {}

  async findAdminUserByLoginId(loginId: string) {
    return await this.db.query.adminUsers.findFirst({
      where: eq(adminUsers.loginId, loginId),
    });
  }

  async findAdminUserById(id: number) {
    return await this.db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
    });
  }

  async listActiveRolesByAdminUserId(adminUserId: number) {
    const rows = await this.db.query.adminRoleGrants.findMany({
      columns: {
        role: true,
      },
      where: and(
        eq(adminRoleGrants.adminUserId, adminUserId),
        isNull(adminRoleGrants.revokedAt),
      ),
    });

    return rows.map((row) => row.role);
  }

  async createAdminSession(data: {
    id: string;
    adminUserId: number;
    sessionTokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    await this.db.insert(adminSessions).values(data);
  }

  async updateAdminUserLastLoginAt(adminUserId: number, lastLoginAt: Date) {
    await this.db
      .update(adminUsers)
      .set({
        lastLoginAt,
        updatedAt: lastLoginAt,
      })
      .where(eq(adminUsers.id, adminUserId));
  }
}
