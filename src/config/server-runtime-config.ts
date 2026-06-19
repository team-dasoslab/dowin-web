const nodeEnv = process.env.NODE_ENV ?? "development";
const runtimeEnv = process.env.NEXTJS_ENV ?? nodeEnv;
const port = process.env.PORT ?? "4000";
const appOrigin = (process.env.APP_BASE_URL ?? `http://localhost:${port}`).replace(
  /\/+$/,
  "",
);

export const serverRuntimeConfig = Object.freeze({
  nodeEnv,
  runtimeEnv,
  isDevelopment: nodeEnv === "development",
  teamCheckinLeadMeasureAgeGateEnabled: runtimeEnv === "production",
  port,
  appOrigin,
  apiDocsUrl: new URL("/api-docs", appOrigin).toString(),
  contactDiscordWebhookUrl: process.env.CONTACT_DISCORD_WEBHOOK_URL ?? "",
  logsDiscordWebhookUrl: process.env.LOGS_DISCORD_WEBHOOK_URL ?? "",
});
