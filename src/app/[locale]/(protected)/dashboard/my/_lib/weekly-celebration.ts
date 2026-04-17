import { toNumberId } from "@/lib/client/frontend-api";

export type WeeklyCelebrationInputLeadMeasure = {
  id?: string | number;
  period?: string;
  targetValue?: number | null;
};

export type WeeklyCelebrationInputWeekly = {
  achieved?: number | null;
};

export type WeeklyCelebrationSnapshot = {
  completedCount: number;
  totalCount: number;
};

export function getWeeklyCelebrationSnapshot(
  activeLeadMeasures: WeeklyCelebrationInputLeadMeasure[],
  weeklyById: Map<number | null, WeeklyCelebrationInputWeekly>,
): WeeklyCelebrationSnapshot {
  const weeklyMeasures = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period !== "MONTHLY",
  );

  return weeklyMeasures.reduce<WeeklyCelebrationSnapshot>(
    (snapshot, leadMeasure) => {
      const targetValue = leadMeasure.targetValue ?? 0;
      const achieved =
        weeklyById.get(toNumberId(leadMeasure.id))?.achieved ?? 0;
      const isCompleted = targetValue > 0 && achieved >= targetValue;

      return {
        completedCount: snapshot.completedCount + (isCompleted ? 1 : 0),
        totalCount: snapshot.totalCount + 1,
      };
    },
    { completedCount: 0, totalCount: 0 },
  );
}

export function getCompletedWeeklyMeasureIds(
  activeLeadMeasures: WeeklyCelebrationInputLeadMeasure[],
  weeklyById: Map<number | null, WeeklyCelebrationInputWeekly>,
) {
  return new Set(
    activeLeadMeasures
      .filter((leadMeasure) => leadMeasure.period !== "MONTHLY")
      .map((leadMeasure) => {
        const leadMeasureId = toNumberId(leadMeasure.id);
        const targetValue = leadMeasure.targetValue ?? 0;
        const achieved = weeklyById.get(leadMeasureId)?.achieved ?? 0;

        return leadMeasureId !== null && targetValue > 0 && achieved >= targetValue
          ? leadMeasureId
          : null;
      })
      .filter((leadMeasureId): leadMeasureId is number => leadMeasureId !== null),
  );
}
