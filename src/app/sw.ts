import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint` string.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Use 'any' casting to bypass environment-specific TS lint errors in the service worker
const sw = self as any;

// 푸시 알림 수신 이벤트
sw.addEventListener("push", (event: any) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/favicon-192x192.png",
      badge: "/favicon-192x192.png",
      data: {
        url: data.data?.url || "/",
      },
    };

    event.waitUntil(sw.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Push event error:", err);
  }
});

// 알림 클릭 이벤트
sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients: any[]) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen);
        }
      }),
  );
});

serwist.addEventListeners();
