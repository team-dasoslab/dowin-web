export type MeasureInput = {
  id: string;
  existingId: number | null;
  name: string;
  period: "WEEKLY" | "MONTHLY";
  targetValue: number;
};

export const createEmptyMeasure = (): MeasureInput => ({
  id: crypto.randomUUID(),
  existingId: null,
  name: "",
  period: "WEEKLY",
  targetValue: 3,
});
