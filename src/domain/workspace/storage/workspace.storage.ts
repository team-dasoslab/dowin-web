import { eq } from "drizzle-orm";
import { workspaces, workspaceMembers, users } from "../../../db/schema";

export class WorkspaceStorage {
  constructor(private db: any) {}

  async findUserWorkspace(userId: number): Promise<any> {
    const member = await this.db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });
    return member?.workspace || null;
  }

  async createWorkspace(name: string): Promise<any> {
    const [newWorkspace] = await this.db
      .insert(workspaces)
      .values({ name })
      .returning();
    return newWorkspace;
  }

  async addMember(workspaceId: number, userId: number, role: "ADMIN" | "MEMBER"): Promise<void> {
    await this.db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role,
    });
  }

  async findMembers(workspaceId: number): Promise<any[]> {
    return await this.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: true,
      },
    });
  }
}
