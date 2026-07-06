export function formatRelativeTime(
  createdAt: string,
  t: (key: string, values?: Record<string, any>) => string
) {
  const createdAtTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdAtTime)) {
    return "";
  }

  const diffMin = Math.floor((Date.now() - createdAtTime) / (1000 * 60));
  if (diffMin <= 0) {
    return t("justNow");
  }
  if (diffMin < 60) {
    return t("minsAgo", { n: diffMin });
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return t("hoursAgo", { n: diffHour });
  }

  return t("daysAgo", { n: Math.floor(diffHour / 24) });
}
