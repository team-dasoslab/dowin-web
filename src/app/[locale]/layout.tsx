import { Providers } from "@/components/Providers";
import { AppLayout } from "@/components/layout/AppLayout";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const headersList = await headers();
  const isNative = headersList.get("x-dowin-client") === "app";

  return (
    <Providers locale={locale} messages={messages} isNative={isNative}>
      <AppLayout>{children}</AppLayout>
    </Providers>
  );
}
