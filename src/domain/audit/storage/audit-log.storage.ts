import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export class AuditLogStorage {
  constructor(private db: Db) {}

  async create(input: {
    actorType: "USER" | "ADMIN";
    actorUserId?: number | null;
    actorAdminUserId?: number | null;
    workspaceId?: number | null;
    entityType:
      | "WORKSPACE"
      | "WORKSPACE_MEMBER"
      | "WORKSPACE_INVITE"
      | "WORKSPACE_TAG"
      | "SCOREBOARD"
      | "LEAD_MEASURE"
      | "DAILY_LOG"
      | "TEAM_MEMO"
      | "USER"
      | "CONTACT_INQUIRY"
      | "ADMIN_USER"
      | "ADMIN_ROLE_GRANT";
    entityId?: number | null;
    actionType:
      | "CREATE"
      | "UPDATE"
      | "DELETE"
      | "ARCHIVE"
      | "REACTIVATE"
      | "RESTORE"
      | "REMOVE_MEMBER"
      | "LEAVE_WORKSPACE"
      | "TRANSFER_ADMIN"
      | "STATUS_CHANGE"
      | "GRANT_ROLE"
      | "REVOKE_ROLE";
    metadata?: string | null;
  }) {
    const [created] = await this.db.insert(auditLogs).values(input).returning();
    return created;
  }
}
