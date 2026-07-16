import { generateId } from "@/lib/utils";

export type MeasureInput = {
  id: string;
  existingId: number | null;
  initialStatus: "ACTIVE" | "ARCHIVED" | null;
  initialPayload?: MeasurePayloadSnapshot | null;
  status: "ACTIVE" | "ARCHIVED";
  name: string;
  period: "WEEKLY" | "MONTHLY";
  targetValue: number;
  trackingMode: "BOOLEAN" | "COUNT";
  dailyTargetCount: number;
  tags: SetupTag[];
  isDeleted?: boolean;
};

export type SetupTag = {
  id: number;
  name: string;
};

export type MeasurePayloadSnapshot = {
  name: string;
  period: "WEEKLY" | "MONTHLY";
  targetValue: number;
  trackingMode: "BOOLEAN" | "COUNT";
  dailyTargetCount: number;
  tagIds: number[];
  orderIndex: number;
};

export const MOCK_SETUP_TAGS: SetupTag[] = [
  { id: 1, name: "운동" },
  { id: 2, name: "건강" },
  { id: 3, name: "집중" },
  { id: 4, name: "루틴" },
  { id: 5, name: "회고" },
  { id: 6, name: "독서" },
];

export const MAX_MEASURE_TAGS = 3;
export const MAX_TAG_NAME_LENGTH = 16;

export const normalizeTagName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export const WEEKLY_TARGET_MAX = 7;

export const getDaysInMonthFromIsoDate = (isoDate: string): number => {
  const [yearText, monthText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return 31;
  }

  return new Date(year, month, 0).getDate();
};

export const getMeasureTargetMax = (
  period: MeasureInput["period"],
  monthlyTargetMax: number,
) => (period === "WEEKLY" ? WEEKLY_TARGET_MAX : monthlyTargetMax);

export const clampMeasureTargetValue = (
  targetValue: number,
  period: MeasureInput["period"],
  monthlyTargetMax: number,
) => {
  const max = getMeasureTargetMax(period, monthlyTargetMax);
  return Math.min(Math.max(targetValue, 1), max);
};

export const createEmptyMeasure = (): MeasureInput => ({
  id: generateId(),
  existingId: null,
  initialStatus: null,
  initialPayload: null,
  status: "ACTIVE",
  name: "",
  period: "WEEKLY",
  targetValue: 3,
  trackingMode: "BOOLEAN",
  dailyTargetCount: 1,
  tags: [],
});
