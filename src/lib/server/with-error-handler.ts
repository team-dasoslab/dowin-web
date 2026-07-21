import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { getDb } from "@/db";
import { apiError } from "@/lib/server/api-response";
import { PlatformError } from "@/lib/server/errors";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest, NextResponse } from "next/server";

type BaseContext = { params?: unknown; [key: string]: unknown };

type ApiHandler<TCtx extends BaseContext = BaseContext> = (
  req: NextRequest,
  ctx: TCtx & { env: ReturnType<typeof getCloudflareContext>["env"]; db: ReturnType<typeof getDb> },
) => Promise<NextResponse | Response>;

export function withErrorHandler<TCtx extends BaseContext = { params?: Promise<unknown> }>(
  handler: ApiHandler<TCtx>,
) {
  return async (req?: NextRequest, ctx?: TCtx) => {
    try {
      const { env } = getCloudflareContext();
      const db = getDb(env.DB);

      const enhancedCtx = {
        ...(ctx || ({} as unknown as TCtx)),
        env,
        db,
      };

      if (req && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");
        const host = req.headers.get("host") || req.nextUrl.host;
        const sourceUrl = origin || referer;

        // Allow explicit app clients
        const isApp = req.headers.get("x-dowin-client") === "app";

        if (!isApp && sourceUrl && host) {
          try {
            const sourceOrigin = new URL(sourceUrl).host;
            if (sourceOrigin !== host) {
              return await apiError("FORBIDDEN", "CSRF Check Failed: Origin mismatch");
            }
          } catch {
            // Invalid URL format in origin/referer
            return await apiError("FORBIDDEN", "CSRF Check Failed: Invalid origin format");
          }
        }
      }

      return await handler(req as NextRequest, enhancedCtx);
    } catch (error) {
      if (error instanceof PlatformError) {
        return await apiError(error.code, error.details);
      }

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
