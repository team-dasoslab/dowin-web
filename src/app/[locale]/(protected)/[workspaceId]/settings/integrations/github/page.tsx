import { getTranslations } from "next-intl/server";
import GithubIntegrationPageClient from "./GithubIntegrationPageClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Integration" });
  return {
    title: t("githubTitle"),
  };
}

export default function GithubIntegrationPage() {
  return <GithubIntegrationPageClient />;
}
