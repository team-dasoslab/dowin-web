import { PlatformError } from "@/lib/server/errors";
import { apiError } from "@/lib/server/api-response";
import type { NextResponse } from "next/server";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

type AsyncHandler<TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => Promise<NextResponse | Response>;

export function withErrorHandler<TArgs extends unknown[]>(
  handler: AsyncHandler<TArgs>,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof PlatformError) {
        return await apiError(error.code, error.details);
      }

      console.error("[Unhandled Error]", error);

      if (serverRuntimeConfig.logsDiscordWebhookUrl) {
        try {
          const isError = error instanceof Error;
          const message = isError ? error.message : String(error);
          const stack = isError && error.stack ? error.stack : "";

          const fields = [
            {
              name: "Message",
              value: message.slice(0, 1000) || "No message",
            },
          ];

          if (stack) {
            fields.push({
              name: "Stack Trace",
              value: `\`\`\`\n${stack.slice(0, 1000)}\n\`\`\``,
            });
          }

          // Execute fetch in the background without awaiting to not block the response
          fetch(serverRuntimeConfig.logsDiscordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [
                {
                  title: "🚨 [Dowin Web] 500 Internal Server Error",
                  color: 0xff0000,
                  fields,
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          }).catch((webhookError) => {
            console.error("[Discord Webhook Error]", webhookError);
          });
        } catch (e) {
          console.error("[Discord Webhook Error]", e);
        }
      }

      return await apiError("INTERNAL_ERROR");
    }
  };
}
