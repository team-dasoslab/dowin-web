import { getDb } from "@/db";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "@/i18n/routing";

export async function getDefaultWorkspaceId(userId: number): Promise<number | null> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storage = new WorkspaceStorage(db);
  const workspace = await storage.findUserWorkspace(userId);
  return workspace ? workspace.id : null;
}

export async function redirectToDefaultWorkspace(userId: number, locale: string) {
  const defaultWorkspaceId = await getDefaultWorkspaceId(userId);
  if (defaultWorkspaceId) {
    redirect({ href: `/${defaultWorkspaceId}/dashboard/my`, locale });
  } else {
    redirect({ href: "/workspace/new", locale });
  }
}
