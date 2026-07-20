import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (_, { db }) => {
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("dowin_sid")?.value;

  if (sessionId) {
    await service.logout(sessionId);
    cookieStore.delete("dowin_sid");
  }

  return apiSuccess(null, 204);
});
