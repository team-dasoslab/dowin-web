import { getDb } from "@/db";
import { getAdminSession } from "@/lib/server/admin-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import AdminLoginPageClient from "./_components/AdminLoginPageClient";

export default async function AdminLoginPage() {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getAdminSession(db);

  if (session) {
    redirect("/admin");
  }

  return <AdminLoginPageClient />;
}
