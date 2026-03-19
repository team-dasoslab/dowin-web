const nodeEnv = process.env.NODE_ENV ?? "development";

export const serverRuntimeConfig = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  port: process.env.PORT ?? "3000",
});
