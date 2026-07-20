import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { devicePushTokenStatusSchema } from "@/domain/notification/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request, { db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = devicePushTokenStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const record = await new NotificationStorage(db).findDevicePushTokenForUser(
    session.userId,
    parsed.data.token,
  );

  return apiSuccess({
    notificationEnabled: record?.notificationEnabled === true && !record.disabledAt,
  });
});
