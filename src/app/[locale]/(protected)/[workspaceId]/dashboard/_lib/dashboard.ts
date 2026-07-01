export const formatWeekLabel = (weekStart?: string, weekEnd?: string) => {
  if (!weekStart || !weekEnd) {
    return "";
  }

  return `${weekStart.slice(5).replace("-", ".")} – ${weekEnd.slice(5).replace("-", ".")}`;
};

export const getRateVariant = (rate: number): "success" | "warning" | "danger" => {
  if (rate >= 80) {
    return "success";
  }

  if (rate >= 50) {
    return "warning";
  }

  return "danger";
};
