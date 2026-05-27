import { getDb } from "@/db";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "@/i18n/routing";
import { cookies } from "next/headers";

export async function getDefaultWorkspacePublicId(userId: number): Promise<string | null> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storage = new WorkspaceStorage(db);
  
  const cookieStore = await cookies();
  const currentWorkspaceUid = cookieStore.get("dowin_workspace_id")?.value;

  if (currentWorkspaceUid) {
    const internalId = await storage.resolveIdByUid(currentWorkspaceUid);
    if (internalId) {
      const membership = await storage.findMembership(internalId, userId);
      if (membership) {
        return currentWorkspaceUid;
      }
    }
  }

  const workspace = await storage.findUserWorkspace(userId);
  if (!workspace) {
    return null;
  }

  if (!workspace.uid) {
    throw new Error(`WORKSPACE_UID_MISSING:${workspace.id}`);
  }

  return workspace.uid;
}

export async function redirectToDefaultWorkspace(userId: number, locale: string) {
  const defaultWorkspacePublicId = await getDefaultWorkspacePublicId(userId);
  if (defaultWorkspacePublicId) {
    redirect({ href: `/${defaultWorkspacePublicId}/dashboard/my`, locale });
  } else {
    redirect({ href: "/workspace/new", locale });
  }
}

export async function redirectToDefaultWorkspacePath(
  userId: number,
  locale: string,
  path: string,
) {
  const defaultWorkspacePublicId = await getDefaultWorkspacePublicId(userId);
  if (defaultWorkspacePublicId) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    redirect({ href: `/${defaultWorkspacePublicId}${normalizedPath}`, locale });
  } else {
    redirect({ href: "/workspace/new", locale });
  }
}
