import { getDb } from "@/db";
import {
  githubRepositories,
  githubUserInstallations,
  workspaceGithubRepositoryLinks,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export function createRepositoryLinkStorage() {
  return {
    async getActiveLinksByWorkspaceId(db: Db, workspaceId: number) {
      return await db
        .select({
          id: workspaceGithubRepositoryLinks.id,
          repositoryId: workspaceGithubRepositoryLinks.repositoryId,
          connectedByUserId: workspaceGithubRepositoryLinks.connectedByUserId,
          status: workspaceGithubRepositoryLinks.status,
          createdAt: workspaceGithubRepositoryLinks.createdAt,
          repository: githubRepositories,
        })
        .from(workspaceGithubRepositoryLinks)
        .innerJoin(
          githubRepositories,
          eq(workspaceGithubRepositoryLinks.repositoryId, githubRepositories.id),
        )
        .innerJoin(
          githubUserInstallations,
          eq(githubRepositories.installationId, githubUserInstallations.id),
        )
        .where(
          and(
            eq(workspaceGithubRepositoryLinks.workspaceId, workspaceId),
            eq(workspaceGithubRepositoryLinks.status, "ACTIVE"),
            eq(githubUserInstallations.status, "ACTIVE"),
          ),
        );
    },

    async getActiveLinkByRepositoryId(db: Db, repositoryId: number) {
      const [result] = await db
        .select()
        .from(workspaceGithubRepositoryLinks)
        .where(
          and(
            eq(workspaceGithubRepositoryLinks.repositoryId, repositoryId),
            eq(workspaceGithubRepositoryLinks.status, "ACTIVE"),
          ),
        );
      return result || null;
    },

    async upsertRepositoryLink(
      db: Db,
      payload: {
        workspaceId: number;
        repositoryId: number;
        connectedByUserId: number;
      },
    ) {
      const [result] = await db
        .insert(workspaceGithubRepositoryLinks)
        .values({
          workspaceId: payload.workspaceId,
          repositoryId: payload.repositoryId,
          connectedByUserId: payload.connectedByUserId,
          status: "ACTIVE",
        })
        .onConflictDoUpdate({
          target: [
            workspaceGithubRepositoryLinks.workspaceId,
            workspaceGithubRepositoryLinks.repositoryId,
          ],
          set: {
            connectedByUserId: payload.connectedByUserId,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    },

    async disconnectRepositoryLink(db: Db, workspaceId: number, linkId: number) {
      const [result] = await db
        .update(workspaceGithubRepositoryLinks)
        .set({ status: "DISCONNECTED", updatedAt: new Date() })
        .where(
          and(
            eq(workspaceGithubRepositoryLinks.id, linkId),
            eq(workspaceGithubRepositoryLinks.workspaceId, workspaceId),
          ),
        )
        .returning();
      return result || null;
    },
  };
}
