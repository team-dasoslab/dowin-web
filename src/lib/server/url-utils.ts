export const buildSearch = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      continue;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
