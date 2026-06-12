import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { resolveLocale } from "@/i18n/detect-locale";
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import { ReactNode } from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#EFF0FA",
};

export const metadata: Metadata = {
  metadataBase: new URL(serverRuntimeConfig.appOrigin),
  applicationName: "Dowin",
  authors: [{ name: "Dasoslab", url: serverRuntimeConfig.appOrigin }],
  generator: "Next.js",
  keywords: [
    "목표 관리",
    "목표 실행",
    "할 일",
    "생산성",
    "플래너",
    "주간 계획",
    "주간 운영",
    "핵심 목표",
    "성공 기준",
    "액션 아이템",
    "점수판",
    "주간 점검",
    "팀 대시보드",
    "워크스페이스",
  ],
  creator: "Dasoslab",
  publisher: "Dasoslab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dowin",
  },
  title: {
    template: "%s | Dowin",
    default: "Dowin",
  },
  description: "가장 중요한 목표에 집중하세요.",
  openGraph: {
    title: "Dowin",
    description: "가장 중요한 목표에 집중하세요.",
    url: "/",
    siteName: "Dowin",
    images: [
      {
        url: "/cover.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dowin",
    description: "가장 중요한 목표에 집중하세요.",
    images: ["/cover.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: "/",
    languages: {
      ko: "/ko",
      en: "/en",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <head></head>
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
