import { redirectToDefaultWorkspacePath } from "@/lib/server/workspace-redirect";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";

const buildSearch = (searchParams: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      continue;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

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

  await redirectToDefaultWorkspacePath(session.userId, locale, `/setup${query}`);
  return null;
}
