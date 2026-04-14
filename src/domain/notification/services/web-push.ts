import {
  buildPushPayload,
  type PushSubscription,
} from "@block65/webcrypto-web-push";

export type WebPushMessage = {
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  url: string;
  pushType: string;
  campaignId: string;
};

export const sendWebPushMessages = async (
  messages: WebPushMessage[],
  vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  },
) => {
  const results = await Promise.allSettled(
    messages.map(async (message) => {
      const subscription: PushSubscription = {
        endpoint: message.endpoint,
        keys: {
          p256dh: message.p256dh,
          auth: message.auth,
        },
        expirationTime: null,
      };

      const payload = await buildPushPayload(
        {
          data: JSON.stringify({
            title: message.title,
            body: message.body,
            icon: "/favicon-192x192.png",
            data: {
              url: message.url,
              pushType: message.pushType,
              campaignId: message.campaignId,
            },
          }),
          options: { ttl: 60 },
        },
        subscription,
        vapidKeys,
      );

      const response = await fetch(
        new Request(message.endpoint, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body as unknown as ArrayBuffer,
        }),
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} - ${text}`);
      }
    }),
  );

  return {
    success: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
};
