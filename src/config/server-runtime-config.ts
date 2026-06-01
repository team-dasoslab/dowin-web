const nodeEnv = process.env.NODE_ENV ?? "development";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = process.env.PORT ?? "4000";
const protocol = process.env.APP_PROTOCOL ?? "http";
const appOrigin = process.env.APP_ORIGIN ?? `${protocol}://${hostname}:${port}`;

export const serverRuntimeConfig = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  hostname,
  port,
  protocol,
  appOrigin,
  apiDocsUrl: new URL("/api-docs", appOrigin).toString(),
  contactDiscordWebhookUrl: process.env.CONTACT_DISCORD_WEBHOOK_URL ?? "",
  logsDiscordWebhookUrl: process.env.LOGS_DISCORD_WEBHOOK_URL ?? "",
});
