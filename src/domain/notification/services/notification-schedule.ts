const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const formatHourMinute = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export const getKstNowParts = (now: Date) => {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const dayOfWeek = kst.getUTCDay() === 0 ? 7 : kst.getUTCDay();
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");

  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    dayOfWeek,
    dateKey: `${year}-${month}-${day}`,
  };
};

export const getKstWeekRange = (now: Date) => {
  const { dateKey, dayOfWeek } = getKstNowParts(now);
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() - (dayOfWeek - 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
    today: dateKey,
  };
};
