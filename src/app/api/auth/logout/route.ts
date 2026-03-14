import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { apiSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (_: Request) => {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("wig_sid")?.value;

  if (sessionId) {
    await service.logout(sessionId);
    cookieStore.delete("wig_sid");
  }

  return apiSuccess(null, 204);
});
