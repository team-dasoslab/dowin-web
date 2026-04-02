const nodeEnv = process.env.NODE_ENV ?? "development";

export const publicRuntimeConfig = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  nextPublicGaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  nextPublicVapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
});
