import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { resolveLocale } from "@/i18n/detect-locale";
import type { Viewport } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import { ReactNode } from "react";
import { RechartsConsolePatcher } from "@/app/_components/RechartsConsolePatcher";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const gaId = publicRuntimeConfig.nextPublicGaId;
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = resolveLocale({
    customLocale: headerList.get("x-dowin-locale"),
    cookieLocale: cookieStore.get("NEXT_LOCALE")?.value,
    acceptLanguage: headerList.get("accept-language"),
  });

  const isNative = headerList.get("x-dowin-client") === "app";
  const platform = isNative ? "app" : "web";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>Dowin</title>
        {/* ... existing meta tags ... */}
        <meta name="description" content="가장 중요한 목표에 집중하세요." />
        <meta property="og:title" content="Dowin" />
        <meta
          property="og:description"
          content="가장 중요한 목표에 집중하세요."
        />
        <meta property="og:image" content="/cover.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dowin" />
        <meta
          name="twitter:description"
          content="가장 중요한 목표에 집중하세요."
        />
        <meta name="twitter:image" content="/cover.png" />
        <meta name="theme-color" content="#EFF0FA" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){window.dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    'client_platform': '${platform}',
                    'user_properties': {
                      'client_type': '${platform}'
                    }
                  });
                `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
