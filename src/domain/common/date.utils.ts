export function getCurrentWeekStart() {
  return getWeekStart(getTodayInKst());
}

export function getWeekDates(weekStart: string) {
  const base = new Date(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return formatDateLocal(date);
  });
}

export function addDays(dateString: string, amount: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + amount);
  return formatDateLocal(date);
}

export function getCurrentMonthStart() {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-01`;
}

export function normalizeMonthStart(monthStart?: string) {
  if (!monthStart) {
    return getCurrentMonthStart();
  }

  const [yearRaw, monthRaw] = monthStart.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
    return `${year}-${pad2(month)}-01`;
  }

  return getCurrentMonthStart();
}

export function getMonthDates(monthStart: string) {
  const [yearRaw, monthRaw] = monthStart.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    return formatDateLocal(date);
  });
}

export function getWeekStart(dateString: string) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  const diff = date.getDate() - weekDay + (weekDay === 0 ? -6 : 1);
  return formatDateLocal(new Date(year, month - 1, diff));
}

export function getWeekStartsInMonth(monthDates: string[]) {
  const weekStarts = Array.from(new Set(monthDates.map((date) => getWeekStart(date))));
  if (monthDates.length === 0) return weekStarts;
  const monthStart = monthDates[0];
  const monthEnd = monthDates[monthDates.length - 1];

  return weekStarts.filter((ws) => {
    const [year, month, day] = ws.split("-").map(Number);
    const thursday = new Date(year, month - 1, day + 3);
    const thursdayStr = formatDateLocal(thursday);
    return thursdayStr >= monthStart && thursdayStr <= monthEnd;
  });
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getTodayInKst(referenceDate: Date = new Date()) {
  const kstDate = new Date(referenceDate.getTime() + 9 * 60 * 60 * 1000);
  return `${kstDate.getUTCFullYear()}-${pad2(kstDate.getUTCMonth() + 1)}-${pad2(
    kstDate.getUTCDate(),
  )}`;
}
