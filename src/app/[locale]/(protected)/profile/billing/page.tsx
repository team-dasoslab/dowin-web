import { ProfileBillingPageClient } from "@/app/[locale]/(protected)/profile/billing/ProfileBillingPageClient";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { redirect } from "next/navigation";

export default function ProfileBillingPage() {
  if (!serverRuntimeConfig.isDevelopment) {
    redirect("/profile");
  }

  return <ProfileBillingPageClient />;
}
