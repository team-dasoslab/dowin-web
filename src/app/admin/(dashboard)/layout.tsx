import { getDb } from "@/db";
import { getAdminSession } from "@/lib/server/admin-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import AdminHeaderClient from "./_components/AdminHeaderClient";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getAdminSession(db);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px] opacity-40"></div>
      <AdminHeaderClient />
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 sm:pt-10">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
