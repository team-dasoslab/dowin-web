import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { resolveLocale } from "@/i18n/detect-locale";
import type { Viewport } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import { ReactNode } from "react";
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dowin" />
        <meta name="theme-color" content="#EFF0FA" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" />

        {/* ... existing startup images ... */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1668-2388.jpg"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1640-2360.jpg"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1536-2048.jpg"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1320-2868.jpg"
          media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1290-2796.jpg"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1206-2622.jpg"
          media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179-2556.jpg"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1260-2736.jpg"
          media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-828-1792.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750-1334.jpg"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
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
