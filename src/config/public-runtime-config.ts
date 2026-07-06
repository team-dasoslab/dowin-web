const nodeEnv = process.env.NODE_ENV ?? "";

export const publicRuntimeConfig = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  nextPublicGaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
});
