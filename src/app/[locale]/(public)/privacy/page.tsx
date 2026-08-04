import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getPrivacyPolicy } from "@/content/legal-documents";
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
    title: t("privacy.title"),
    description: t("privacy.description"),
    alternates: { canonical: `/${locale}/privacy` },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getPrivacyPolicy(locale as Locale)} />;
}
