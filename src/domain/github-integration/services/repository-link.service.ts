import { getDb } from "@/db";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createOAuthStorage } from "../storage/oauth.storage";
import { createRepositoryLinkStorage } from "../storage/repository-link.storage";

export function createRepositoryLinkService(env: CloudflareEnv) {
  const db = getDb(env.DB);
  const linkStorage = createRepositoryLinkStorage();
  const oauthStorage = createOAuthStorage();

  return {
    async getWorkspaceIntegrationStatus(workspaceId: number, userId: number) {
      // 1. Check user's GitHub installations
      const installations = await oauthStorage.getInstallationsByUserId(db, userId);
      const activeInstallations = installations.filter((i) => i.status === "ACTIVE");
      const hasGithubAccountConnected = activeInstallations.length > 0;

      // 2. Fetch available repositories from those installations
      let availableRepositories = [];
      for (const inst of activeInstallations) {
        const repos = await oauthStorage.getRepositoriesByInstallationId(db, inst.id);
        availableRepositories.push(...repos);
      }

      // 3. Fetch active links for all these repositories
      const activeLinksForRepos = await linkStorage.getActiveLinksByRepositoryIds(
        db,
        availableRepositories.map((r) => r.id),
      );

      // 4. Annotate repositories with isLinkedToOtherWorkspace
      availableRepositories = availableRepositories.map((repo) => {
        const link = activeLinksForRepos.find((l) => l.repositoryId === repo.id);
        return {
          ...repo,
          isLinkedToOtherWorkspace: link ? link.workspaceId !== workspaceId : false,
        };
      });

      // 5. Fetch active links for the current workspace
      const activeLinks = await linkStorage.getActiveLinksByWorkspaceId(db, workspaceId);

      return {
        hasGithubAccountConnected,
        availableRepositories,
        activeLinks,
      };
    },

    async linkRepository(workspaceId: number, userId: number, repositoryId: number) {
      // Check if this repository is available to the user
      const installations = await oauthStorage.getInstallationsByUserId(db, userId);
      const activeInstallations = installations.filter((i) => i.status === "ACTIVE");

      let repoAvailable = false;
      for (const inst of activeInstallations) {
        const repos = await oauthStorage.getRepositoriesByInstallationId(db, inst.id);
        if (repos.some((r) => r.id === repositoryId)) {
          repoAvailable = true;
          break;
        }
      }

      if (!repoAvailable) {
        throw new NotFoundError("NOT_FOUND", "Repository not found or access denied");
      }

      // Check if it's already linked to ANOTHER workspace
      const existingLink = await linkStorage.getActiveLinkByRepositoryId(db, repositoryId);
      if (existingLink && existingLink.workspaceId !== workspaceId) {
        throw new ConflictError("REPO_ALREADY_LINKED");
      }

      // Upsert link
      return await linkStorage.upsertRepositoryLink(db, {
        workspaceId,
        repositoryId,
        connectedByUserId: userId,
      });
    },

    async disconnectRepository(workspaceId: number, linkId: number) {
      const result = await linkStorage.disconnectRepositoryLink(db, workspaceId, linkId);
      if (!result) {
        throw new NotFoundError("NOT_FOUND", "Link not found");
      }
      return result;
    },
  };
}
