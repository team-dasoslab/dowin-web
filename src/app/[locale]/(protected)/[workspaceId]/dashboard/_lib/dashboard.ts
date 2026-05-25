export const formatWeekLabel = (weekStart?: string, weekEnd?: string) => {
  if (!weekStart || !weekEnd) {
    return "";
  }

  return `${weekStart.slice(5).replace("-", ".")} – ${weekEnd.slice(5).replace("-", ".")}`;
};

export const getRateTone = (rate: number) => {
  if (rate >= 80) {
    return "text-green-700 bg-green-50 border-green-200";
  }

  if (rate >= 50) {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }

  return "text-red-700 bg-red-50 border-red-200";
};
