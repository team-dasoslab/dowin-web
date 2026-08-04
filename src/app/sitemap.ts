import { MetadataRoute } from "next";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

// Bump when RootLandingPage copy/sections meaningfully change.
const LANDING_LAST_MODIFIED = new Date("2026-08-04");
const PRIVACY_LAST_MODIFIED = new Date("2026-04-28");
const TERMS_LAST_MODIFIED = new Date("2026-04-28");
const BILLING_POLICY_LAST_MODIFIED = new Date("2026-06-01");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = serverRuntimeConfig.appOrigin;

  return [
    {
      url: `${baseUrl}`,
      lastModified: LANDING_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 1,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko`,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/ko`,
      lastModified: LANDING_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: LANDING_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...(["ko", "en"] as const).flatMap((locale) => [
      {
        url: `${baseUrl}/${locale}/privacy`,
        lastModified: PRIVACY_LAST_MODIFIED,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/${locale}/terms`,
        lastModified: TERMS_LAST_MODIFIED,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/${locale}/billing-policy`,
        lastModified: BILLING_POLICY_LAST_MODIFIED,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
    ]),
  ];
}
