import { redirectToDefaultWorkspacePath } from "@/lib/server/workspace-redirect";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";

export default async function WorkspaceSettingsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  await redirectToDefaultWorkspacePath(session.userId, locale, "/settings");
  return null;
}
