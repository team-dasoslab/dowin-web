import { ProfileBillingPageClient } from "@/app/[locale]/(protected)/workspace/billing/ProfileBillingPageClient";

export default async function WorkspaceProfileBillingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <ProfileBillingPageClient />;
}
