import { getDb } from "@/db";
import { adminRoleGrants } from "@/db/schema";
import { getAdminSessionWithRefresh } from "@/lib/server/admin-auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { and, eq, isNull } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;
type AdminRole =
  | "SUPPORT_ADMIN"
  | "BILLING_ADMIN"
  | "RECOVERY_ADMIN"
  | "SYSTEM_ADMIN";

export const requireAdminSession = async (db: Db) => {
  const session = await getAdminSessionWithRefresh(db);

  if (!session) {
    throw new UnauthorizedError("UNAUTHORIZED");
  }

  return session;
};

export const requireAdminRole = async (
  db: Db,
  adminUserId: number,
  role: AdminRole,
) => {
  const grant = await db.query.adminRoleGrants.findFirst({
    columns: {
      id: true,
      role: true,
      adminUserId: true,
    },
    where: and(
      eq(adminRoleGrants.adminUserId, adminUserId),
      eq(adminRoleGrants.role, role),
      isNull(adminRoleGrants.revokedAt),
    ),
  });

  if (!grant) {
    throw new ForbiddenError("FORBIDDEN");
  }

  return grant;
};

export const requireAnyAdminRole = async (
  db: Db,
  adminUserId: number,
  roles: AdminRole[],
) => {
  for (const role of roles) {
    const grant = await db.query.adminRoleGrants.findFirst({
      columns: {
        id: true,
        role: true,
        adminUserId: true,
      },
      where: and(
        eq(adminRoleGrants.adminUserId, adminUserId),
        eq(adminRoleGrants.role, role),
        isNull(adminRoleGrants.revokedAt),
      ),
    });

    if (grant) {
      return grant;
    }
  }

  throw new ForbiddenError("FORBIDDEN");
};
