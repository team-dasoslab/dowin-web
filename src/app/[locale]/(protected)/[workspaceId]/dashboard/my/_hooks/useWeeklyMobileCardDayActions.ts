import { WeeklyMobileCardsProps } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/WeeklyMobileCards";

export const useWeeklyMobileCardDayActions = (
  leadMeasureId: number | null,
  date: string,
  toggleLog: WeeklyMobileCardsProps["toggleLog"],
) => {
  const handleCountSave = (newCount: number) => {
    if (leadMeasureId !== null) {
      toggleLog(leadMeasureId, date, newCount);
    }
  };

  return { handleCountSave };
};
