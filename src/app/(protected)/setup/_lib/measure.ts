export type MeasureInput = {
  id: string;
  existingId: number | null;
  name: string;
  period: "WEEKLY" | "MONTHLY";
  targetValue: number;
};

export const WEEKLY_TARGET_MAX = 7;

export const getDaysInMonthFromIsoDate = (isoDate: string): number => {
  const [yearText, monthText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
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
  id: crypto.randomUUID(),
  existingId: null,
  name: "",
  period: "WEEKLY",
  targetValue: 3,
});
