import { ProfileBillingPageClient } from "@/app/[locale]/(protected)/workspace/billing/ProfileBillingPageClient";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { redirect } from "next/navigation";

export default async function WorkspaceProfileBillingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  if (!serverRuntimeConfig.isDevelopment) {
    redirect(`/${workspaceId}/profile`);
  }

  return <ProfileBillingPageClient />;
}
