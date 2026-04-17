export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const toKstDate = (date: Date = new Date()) => {
  return new Date(date.getTime() + KST_OFFSET_MS);
};

export const formatUtcDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const parseUtcDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const isValidDateString = (value: string | null | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = parseUtcDate(value);
  return formatUtcDate(parsed) === value;
};

export const addDays = (date: string, amount: number) => {
  const parsed = parseUtcDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return formatUtcDate(parsed);
};

export const getMonthStart = (date: string) => {
  const parsed = parseUtcDate(date);
  parsed.setUTCDate(1);
  return formatUtcDate(parsed);
};

export const addMonths = (date: string, amount: number) => {
  const parsed = parseUtcDate(date);
  const originalDate = parsed.getUTCDate();

  parsed.setUTCDate(1);
  parsed.setUTCMonth(parsed.getUTCMonth() + amount);

  const lastDate = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0),
  ).getUTCDate();

  parsed.setUTCDate(Math.min(originalDate, lastDate));
  return formatUtcDate(parsed);
};

export const getMonthDates = (monthStart: string) => {
  const start = parseUtcDate(getMonthStart(monthStart));
  const dates: string[] = [];
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const lastDate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  for (let day = 1; day <= lastDate; day += 1) {
    dates.push(formatUtcDate(new Date(Date.UTC(year, month, day))));
  }

  return dates;
};

export const getMonthCalendarWeeks = (monthStart: string) => {
  const monthDates = getMonthDates(monthStart);
  const weeks: Array<Array<string | null>> = [];
  let currentWeek = new Array<string | null>(7).fill(null);

  monthDates.forEach((date, index) => {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    const dayIndex = day === 0 ? 6 : day - 1;
    currentWeek[dayIndex] = date;

    if (dayIndex === 6 || index === monthDates.length - 1) {
      weeks.push(currentWeek);
      currentWeek = new Array<string | null>(7).fill(null);
    }
  });

  return weeks;
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

export const getWeekDates = (anchorDate: string = getTodayInKst()): string[] => {
  const dates: string[] = [];
  const parsed = parseUtcDate(anchorDate);
  const day = parsed.getUTCDay();
  const diff = parsed.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), diff));

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + i);
    dates.push(formatUtcDate(date));
  }

  return dates;
};
