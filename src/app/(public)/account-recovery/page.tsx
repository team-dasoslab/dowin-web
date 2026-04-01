import AccountRecoveryPageClient from "@/app/_components/AccountRecoveryPageClient";
import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";

export default async function AccountRecoveryPage() {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (session) {
    redirect("/dashboard/my");
  }

  return <AccountRecoveryPageClient />;
}
