import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseTimeString = (time: string) => {
  const matched = TIME_REGEX.exec(time);
  if (!matched) {
    return null;
  }

  return {
    hour: Number(matched[1]),
    minute: Number(matched[2]),
  };
};

export const userNotificationSettingsUpdateSchema = z.object({
  dailyReminderEnabled: z.boolean(),
  dailyReminderTime: z
    .string()
    .regex(TIME_REGEX, "시간은 HH:mm 형식이어야 합니다."),
});

export const devicePushTokenRegisterSchema = z.object({
  provider: z.literal("FCM"),
  platform: z.enum(["IOS", "ANDROID"]),
  token: z.string().min(1, "유효한 디바이스 토큰이 필요합니다."),
  appVersion: z.string().trim().min(1).optional(),
  notificationEnabled: z.boolean(),
});

export const devicePushTokenDisableSchema = z.object({
  token: z.string().min(1, "유효한 디바이스 토큰이 필요합니다."),
});

export const devicePushTokenStatusSchema = z.object({
  token: z.string().min(1, "유효한 디바이스 토큰이 필요합니다."),
});
