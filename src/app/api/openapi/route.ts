import { readFile } from "node:fs/promises";
import path from "node:path";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!serverRuntimeConfig.isDevelopment) {
    return new Response("Not Found", { status: 404 });
  }

  const specPath = path.join(process.cwd(), "src/api-spec/openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  return new Response(spec, {
    headers: {
      "content-type": "application/yaml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
