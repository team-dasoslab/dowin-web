import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { redirectToDefaultWorkspacePath } from "@/lib/server/workspace-redirect";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { buildSearch } from "@/lib/server/url-utils";

export default async function SetupRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = buildSearch(await searchParams);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  await redirectToDefaultWorkspacePath(
    session.userId,
    locale,
    `/setup${query}`,
  );
  return null;
}
