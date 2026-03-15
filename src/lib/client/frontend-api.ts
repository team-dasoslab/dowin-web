type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
        details?: Record<string, string[] | undefined>;
      };
    };
  };
};

const getFirstDetailMessage = (
  details: Record<string, string[] | undefined> | undefined,
): string | undefined => {
  if (!details) {
    return undefined;
  }

  for (const messages of Object.values(details)) {
    const firstMessage = messages?.[0];

    if (firstMessage) {
      return firstMessage;
    }
  }

  return undefined;
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  return (error as ApiErrorShape)?.response?.status;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const apiError = (error as ApiErrorShape)?.response?.data?.error;
  const detailMessage = getFirstDetailMessage(apiError?.details);

  return detailMessage || apiError?.message || fallback;
};

export const toNumberId = (
  value: number | string | null | undefined,
): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};
