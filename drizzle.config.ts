import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/49e0d94d8c81f65da9e78ff3bd1a73bd55b2a93bd87470c3aadb9b40c87beaac.sqlite",
  },
});
