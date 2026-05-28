import LoginPageClient from "@/app/_components/LoginPageClient";
import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (session) {
    await redirectToDefaultWorkspace(session.userId, locale);
  }

  return <LoginPageClient />;
}
