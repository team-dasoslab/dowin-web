import { LegalDocumentPage } from "@/app/_components/LegalDocumentPage";
import { getBillingPolicy } from "@/content/legal-documents";
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
    title: t("billingPolicy.title"),
    description: t("billingPolicy.description"),
    alternates: { canonical: `/${locale}/billing-policy` },
  };
}

export default async function BillingPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage {...getBillingPolicy(locale as Locale)} />;
}
