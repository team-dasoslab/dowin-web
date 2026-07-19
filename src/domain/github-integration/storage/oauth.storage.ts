import { githubInstallationStates, githubUserInstallations, githubRepositories } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db";

type Db = ReturnType<typeof getDb>;

export function createOAuthStorage() {
  return {
    async createState(db: Db, payload: {
      state: string;
      userId: number;
      workspaceId: number;
      locale: "ko" | "en";
      expiresAt: Date;
    }) {
      const [result] = await db.insert(githubInstallationStates).values({
        state: payload.state,
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        locale: payload.locale,
        status: "PENDING",
        expiresAt: payload.expiresAt,
      }).returning();
      return result;
    },
    
    async disconnectInstallation(db: Db, userId: number, installationId: string) {
      await db
        .update(githubUserInstallations)
        .set({ status: "DISCONNECTED", updatedAt: new Date() })
        .where(
          and(
            eq(githubUserInstallations.userId, userId),
            eq(githubUserInstallations.installationId, installationId)
          )
        );
    },
    
    async getInstallationsByUserId(db: Db, userId: number) {
      return await db
        .select()
        .from(githubUserInstallations)
        .where(eq(githubUserInstallations.userId, userId));
    },
    
    async getRepositoriesByInstallationId(db: Db, installationId: number) {
      return await db
        .select()
        .from(githubRepositories)
        .where(eq(githubRepositories.installationId, installationId));
    },

    async getState(db: Db, state: string) {
      const [result] = await db
        .select()
        .from(githubInstallationStates)
        .where(eq(githubInstallationStates.state, state));
      return result || null;
    },

    async updateState(db: Db, id: number, updates: Partial<typeof githubInstallationStates.$inferInsert>) {
      const [result] = await db
        .update(githubInstallationStates)
        .set(updates)
        .where(eq(githubInstallationStates.id, id))
        .returning();
      return result;
    },

    async upsertInstallation(db: Db, payload: {
      userId: number;
      installationId: string;
      accountLogin: string;
      accountId: string;
      status: "ACTIVE" | "SUSPENDED" | "DISCONNECTED";
    }) {
      const [result] = await db.insert(githubUserInstallations).values(payload)
        .onConflictDoUpdate({
          target: [githubUserInstallations.userId, githubUserInstallations.installationId],
          set: {
            accountLogin: payload.accountLogin,
            accountId: payload.accountId,
            status: payload.status,
            updatedAt: new Date(),
          },
        }).returning();
      return result;
    },

    async upsertRepositories(db: Db, installationInternalId: number, repositories: Array<{
      githubRepositoryId: string;
      ownerLogin: string;
      name: string;
      fullName: string;
      private: boolean;
    }>) {
      if (repositories.length === 0) return;
      
      const values = repositories.map(repo => ({
        installationId: installationInternalId,
        githubRepositoryId: repo.githubRepositoryId,
        ownerLogin: repo.ownerLogin,
        name: repo.name,
        fullName: repo.fullName,
        private: repo.private,
        status: "ACTIVE" as const,
      }));

      await db.insert(githubRepositories).values(values)
        .onConflictDoUpdate({
          target: [githubRepositories.installationId, githubRepositories.githubRepositoryId],
          set: {
            ownerLogin: sql`excluded.owner_login`,
            name: sql`excluded.name`,
            fullName: sql`excluded.full_name`,
            private: sql`excluded.private`,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        });
    }
  };
}
