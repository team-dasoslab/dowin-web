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
