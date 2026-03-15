export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const toKstDate = (date: Date = new Date()) => {
  return new Date(date.getTime() + KST_OFFSET_MS);
};

const formatUtcDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const getTodayInKst = () => {
  const kstNow = toKstDate();
  return formatUtcDate(
    new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
      ),
    ),
  );
};

export const getWeekDates = (): string[] => {
  const dates: string[] = [];
  const kstNow = toKstDate();
  const day = kstNow.getUTCDay();
  const diff = kstNow.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), diff),
  );

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + i);
    dates.push(formatUtcDate(date));
  }

  return dates;
};
