import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string; workspaceId: string }>;
}>) {
  const { locale, workspaceId } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const storage = new WorkspaceStorage(db);
  const resolvedWorkspaceId = await storage.resolveIdByUid(workspaceId);

  if (!resolvedWorkspaceId) {
    notFound();
  }

  const membership = await storage.findMembership(
    resolvedWorkspaceId,
    session.userId,
  );

  if (!membership) {
    notFound();
  }

  return <>{children}</>;
}
