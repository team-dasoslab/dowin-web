import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getBillingPolicy } from "@/content/legal-documents";
import type { Locale } from "@/i18n/detect-locale";
import { setRequestLocale } from "next-intl/server";

export default async function BillingPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getBillingPolicy(locale as Locale)} />;
}
