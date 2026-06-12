import { MetadataRoute } from "next";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = serverRuntimeConfig.appOrigin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
