import { getDb, type DowinDatabase } from "@/db";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";

export type PageContext = {
  db: DowinDatabase;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  env: Awaited<ReturnType<typeof getCloudflareContext>>["env"];
};

export async function requirePageContext(): Promise<PageContext> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session || !session.userId) {
    redirect("/login");
  }

  return { env, db, session };
}
