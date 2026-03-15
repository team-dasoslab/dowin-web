export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export const getWeekDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);

  monday.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);

    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};
