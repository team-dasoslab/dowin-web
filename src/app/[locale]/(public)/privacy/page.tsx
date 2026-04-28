import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getPrivacyPolicy } from "@/content/legal-documents";
import type { Locale } from "@/i18n/detect-locale";
import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getPrivacyPolicy(locale as Locale)} />;
}
