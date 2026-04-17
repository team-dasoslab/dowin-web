import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import { serverRuntimeConfig } from "./src/config/server-runtime-config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: serverRuntimeConfig.isDevelopment,
});

const nextConfig: NextConfig = {
  /* config options here */
  // Silence Turbopack vs Webpack conflict in Next.js 16
  turbopack: {},
};

export default withNextIntl(
  serverRuntimeConfig.isDevelopment ? nextConfig : withSerwist(nextConfig),
);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
