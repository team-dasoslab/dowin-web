export const formatDate = (
  value?: string | null,
  locale: string = "ko",
  fallback: string = "날짜 미정",
) => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const resolvedLocale = locale === "en" ? "en-US" : "ko-KR";
  const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
    month: "short",
    day: "numeric",
  });

  return dateFormatter.format(parsed);
};
