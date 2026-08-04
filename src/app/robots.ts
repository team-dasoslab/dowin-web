import { MetadataRoute } from "next";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

// AI crawlers we explicitly want indexing/citing Dowin content, called out by
// name (rather than relying only on the "*" wildcard) so the intent is
// visible and each one can be tuned independently later.
const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Yeti",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = serverRuntimeConfig.appOrigin;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: "/admin/",
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
