"use client";

import { BridgeInitializer } from "@/components/bridge/BridgeInitializer";
import { CampaignAttribution } from "@/components/CampaignAttribution";
import { NavigationHistoryTracker } from "@/components/NavigationHistoryTracker";
import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { NativeAppProvider } from "@/context/NativeAppContext";
import { ToastProvider } from "@/context/ToastContext";
import { usePushNotificationAnalytics } from "@/hooks/usePushNotificationAnalytics";
import { DEFAULT_TIME_ZONE } from "@/i18n/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { Suspense, useEffect, useState } from "react";

import { ThemeProvider } from "@/providers/ThemeProvider";

export function Providers({
  children,
  locale,
  messages,
  isNative,
}: {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  isNative: boolean;
}) {
  const gaId = publicRuntimeConfig.nextPublicGaId;
  usePushNotificationAnalytics(gaId.length > 0);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <NativeAppProvider isNative={isNative}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={DEFAULT_TIME_ZONE}
        >
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <BridgeInitializer isNative={isNative} />
              <Suspense fallback={null}>
                <NavigationHistoryTracker />
                <CampaignAttribution />
              </Suspense>
              {children}
            </ToastProvider>
          </QueryClientProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </NativeAppProvider>
  );
}
