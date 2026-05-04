import { PricingPageClient } from "@/app/[locale]/(protected)/pricing/PricingPageClient";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { redirect } from "next/navigation";

export default function PricingPage() {
  if (!serverRuntimeConfig.isDevelopment) {
    redirect("/profile");
  }

  return <PricingPageClient />;
}
