export const formatWeekLabel = (weekStart?: string, weekEnd?: string) => {
  if (!weekStart || !weekEnd) {
    return "";
  }

  return `${weekStart.slice(5).replace("-", ".")} – ${weekEnd.slice(5).replace("-", ".")}`;
};

export const getRateTone = (rate: number) => {
  if (rate >= 80) {
    return "text-success bg-success/10";
  }

  if (rate >= 50) {
    return "text-amber-500 bg-amber-500/10";
  }

  return "text-danger bg-danger/10";
};
