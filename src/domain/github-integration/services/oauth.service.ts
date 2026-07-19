import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { createOAuthStorage } from "../storage/oauth.storage";

export type GithubEnv = CloudflareEnv & {
  GITHUB_APP_SLUG: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_CLIENT_ID: string;
  GITHUB_APP_CLIENT_SECRET: string;
};

export function createOAuthService(env: GithubEnv) {
  const db = getDb(env.DB);
  const storage = createOAuthStorage();

  return {
    async getIntegrationStatus(userId: number) {
      const installations = await storage.getInstallationsByUserId(db, userId);
      const repositories = [];
      for (const inst of installations) {
        if (inst.status === "ACTIVE") {
          const repos = await storage.getRepositoriesByInstallationId(db, inst.id);
          repositories.push(...repos);
        }
      }
      
      return {
        isConnected: installations.some(i => i.status === "ACTIVE"),
        accountLogin: installations.find(i => i.status === "ACTIVE")?.accountLogin || null,
        installations,
        repositories,
      };
    },
    
    async disconnectInstallation(userId: number, installationId: string) {
      await storage.disconnectInstallation(db, userId, installationId);
    },

    async createInstallUrl(userId: number, workspaceId: number, locale: "ko" | "en") {
      const state = nanoid(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      
      await storage.createState(db, {
        state,
        userId,
        workspaceId,
        locale,
        expiresAt,
      });

      const appSlug = env.GITHUB_APP_SLUG;
      return {
        url: `https://github.com/apps/${appSlug}/installations/new?state=${state}`,
      };
    },

    async handleSetupCallback(state: string, installationId: string, setupAction: string) {
      const stateRow = await storage.getState(db, state);
      if (!stateRow) throw new Error("Invalid state");
      if (stateRow.status !== "PENDING" || stateRow.expiresAt < new Date()) {
        throw new Error("Expired state");
      }

      await storage.updateState(db, stateRow.id, {
        installationId,
        setupAction,
      });

      const clientId = env.GITHUB_APP_CLIENT_ID;
      const baseUrl = env.APP_BASE_URL;
      const redirectUri = `${baseUrl}/api/integrations/github/oauth/callback`;
      
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    },
    
    async handleOAuthCallback(code: string, state: string) {
      const stateRow = await storage.getState(db, state);
      if (!stateRow) throw new Error("Invalid state");
      if (stateRow.status !== "PENDING" || stateRow.expiresAt < new Date()) {
        throw new Error("Expired state");
      }

      // 1. Exchange code for user access token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_APP_CLIENT_ID,
          client_secret: env.GITHUB_APP_CLIENT_SECRET,
          code,
        }),
      });
      
      if (!tokenRes.ok) throw new Error("Failed to get access token");
      const tokenData = await tokenRes.json<{ access_token?: string }>();
      if (!tokenData.access_token) throw new Error("No access token in response");
      
      const userToken = tokenData.access_token;
      
      // 2. Fetch user's installations to verify access and get installation details
      const installationsRes = await fetch("https://api.github.com/user/installations", {
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Dowin-App",
        }
      });
      
      if (!installationsRes.ok) throw new Error("Failed to fetch installations");
      const installationsData = await installationsRes.json<{
        installations: Array<{
          id: number;
          account: {
            login: string;
            id: number;
          };
          suspended_at: string | null;
        }>
      }>();
      
      // If we got an installationId from setup callback, find it
      const targetInstallationId = stateRow.installationId;
      const installation = installationsData.installations.find(inst => inst.id.toString() === targetInstallationId);
      
      if (!targetInstallationId || !installation) {
        throw new Error("Installation not found or access denied");
      }
      
      // 3. Upsert user installation
      const dbInstallation = await storage.upsertInstallation(db, {
        userId: stateRow.userId,
        installationId: installation.id.toString(),
        accountLogin: installation.account.login,
        accountId: installation.account.id.toString(),
        status: installation.suspended_at ? "SUSPENDED" : "ACTIVE",
      });
      
      // 4. Fetch repositories accessible to this user for this installation
      const reposRes = await fetch(`https://api.github.com/user/installations/${installation.id}/repositories`, {
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Dowin-App",
        }
      });
      
      if (!reposRes.ok) throw new Error("Failed to fetch repositories");
      const reposData = await reposRes.json<{
        repositories: Array<{
          id: number;
          name: string;
          full_name: string;
          private: boolean;
          owner: {
            login: string;
          }
        }>
      }>();
      
      // 5. Upsert repositories
      const mappedRepos = reposData.repositories.map(repo => ({
        githubRepositoryId: repo.id.toString(),
        ownerLogin: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      }));
      
      await storage.upsertRepositories(db, dbInstallation.id, mappedRepos);
      
      // 6. Complete state
      await storage.updateState(db, stateRow.id, {
        status: "COMPLETED",
        completedAt: new Date(),
      });
      
      return {
        workspaceId: stateRow.workspaceId,
        locale: stateRow.locale,
      };
    }
  };
}
