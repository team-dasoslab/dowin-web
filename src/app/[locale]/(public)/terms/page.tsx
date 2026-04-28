import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getTermsOfService } from "@/content/legal-documents";
import type { Locale } from "@/i18n/detect-locale";
import { setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getTermsOfService(locale as Locale)} />;
}
