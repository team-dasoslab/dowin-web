import { PricingPageClient } from "@/app/[locale]/(protected)/pricing/PricingPageClient";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { redirect } from "next/navigation";

export default async function WorkspacePricingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  if (!serverRuntimeConfig.isDevelopment) {
    redirect(`/${workspaceId}/profile`);
  }

  return <PricingPageClient />;
}
