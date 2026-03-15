import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
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
