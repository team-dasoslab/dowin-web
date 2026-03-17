import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxRangeDays = 92;

function parseDate(date: string) {
  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function getDayCountInclusive(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return null;
  }

  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / 86_400_000) + 1;
}

export const analyticsExportQuerySchema = z
  .object({
    from: z.string().regex(datePattern, "날짜 형식이 올바르지 않습니다."),
    to: z.string().regex(datePattern, "날짜 형식이 올바르지 않습니다."),
    leadMeasureIds: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value ||
          value
            .split(",")
            .every((part) => /^\d+$/.test(part.trim())),
        "선행지표 ID 형식이 올바르지 않습니다.",
      )
      .transform((value) => {
        if (!value || value.trim() === "") {
          return undefined;
        }

        return value
          .split(",")
          .map((part) => Number(part.trim()))
          .filter((id) => Number.isInteger(id) && id > 0);
      }),
    view: z.enum(["week", "month"]).optional(),
  })
  .superRefine((value, ctx) => {
    const dayCount = getDayCountInclusive(value.from, value.to);
    if (dayCount === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "날짜 형식이 올바르지 않습니다.",
      });
      return;
    }

    if (dayCount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "종료일은 시작일 이후여야 합니다.",
      });
    }

    if (dayCount > maxRangeDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "조회 기간은 최대 92일까지만 가능합니다.",
      });
    }
  });

export type AnalyticsExportQuery = z.infer<typeof analyticsExportQuerySchema>;
