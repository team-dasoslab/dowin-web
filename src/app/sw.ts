import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint` string.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

type PushMessageData = {
  title: string;
  body?: string;
  icon?: string;
  data?: {
    url?: string;
    pushType?: string;
    campaignId?: string;
  };
};

type PushEventLike = Event & {
  data?: {
    json(): PushMessageData;
  };
  waitUntil(promise: Promise<unknown>): void;
};

type NotificationClickEventLike = Event & {
  notification: Notification & {
    data: {
      url?: string;
      pushType?: string;
      campaignId?: string;
    };
  };
  waitUntil(promise: Promise<unknown>): void;
};

type ServiceWorkerClient = {
  url: string;
  focus(): Promise<unknown>;
  postMessage?(message: unknown): void;
};

type ServiceWorkerClients = {
  matchAll(options?: {
    type?: "window" | "worker" | "sharedworker" | "all";
    includeUncontrolled?: boolean;
  }): Promise<readonly ServiceWorkerClient[]>;
  openWindow?(url: string): Promise<unknown>;
};

type ServiceWorkerScope = ServiceWorkerGlobalScope & {
  addEventListener(
    type: "push",
    listener: (event: PushEventLike) => void,
  ): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: NotificationClickEventLike) => void,
  ): void;
  registration: ServiceWorkerRegistration;
  clients: ServiceWorkerClients;
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

declare const self: ServiceWorkerScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

const sw = self;

// 푸시 알림 수신 이벤트
sw.addEventListener("push", (event) => {
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
sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || "/dashboard/my";
  const analyticsMessage = {
    type: "push-notification-clicked",
    payload: {
      targetPath: urlToOpen,
      pushType: event.notification.data.pushType || "unknown",
      campaignId: event.notification.data.campaignId || "unknown",
    },
  };

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients: readonly ServiceWorkerClient[]) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus().then(() => {
              client.postMessage?.(analyticsMessage);
            });
          }
        }
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen).then((client) => {
            if (client && typeof client === "object" && "postMessage" in client) {
              (client as ServiceWorkerClient).postMessage?.(analyticsMessage);
            }
          });
        }
      }),
  );
});

serwist.addEventListeners();
