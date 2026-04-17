"use client";

import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { ToastProvider } from "@/context/ToastContext";
import { usePushNotificationAnalytics } from "@/hooks/usePushNotificationAnalytics";
import { useSerwistRegistration } from "@/hooks/useSerwistRegistration";
import { DEFAULT_TIME_ZONE } from "@/i18n/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { NavigationHistoryTracker } from "@/components/NavigationHistoryTracker";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  const gaId = publicRuntimeConfig.nextPublicGaId;
  const shouldRegisterServiceWorker = !publicRuntimeConfig.isDevelopment;

  useSerwistRegistration(shouldRegisterServiceWorker);
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
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={DEFAULT_TIME_ZONE}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Suspense fallback={null}>
            <NavigationHistoryTracker />
          </Suspense>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
