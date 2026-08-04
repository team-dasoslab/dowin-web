import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getTermsOfService } from "@/content/legal-documents";
import type { Locale } from "@/i18n/detect-locale";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("terms.title"),
    description: t("terms.description"),
    alternates: { canonical: `/${locale}/terms` },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getTermsOfService(locale as Locale)} />;
}
