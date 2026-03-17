import { productUpdates, type ProductUpdate } from "@/content/product-updates";

export const PRODUCT_UPDATES_NEW_WINDOW_DAYS = 14;
export const PRODUCT_UPDATES_DISMISS_STORAGE_KEY =
  "wig:dismissed-product-update";

type DismissedProductUpdate = {
  updateId: string;
};

function parsePublishedAt(value: string) {
  const normalized = value.replace(/\./g, "-");
  return new Date(`${normalized}T00:00:00+09:00`);
}

function startOfTodayKst(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
}

export function isNewProductUpdate(
  update: Pick<ProductUpdate, "publishedAt">,
  now = new Date(),
) {
  const today = startOfTodayKst(now);
  const publishedAt = parsePublishedAt(update.publishedAt);
  const diffMs = today.getTime() - publishedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays < PRODUCT_UPDATES_NEW_WINDOW_DAYS;
}

export function getProductUpdates(now = new Date()) {
  return productUpdates.map((update) => ({
    ...update,
    isNew: isNewProductUpdate(update, now),
  }));
}

export function getLatestMajorProductUpdate(now = new Date()) {
  return getProductUpdates(now).find((update) => update.isMajor) ?? null;
}

export function readDismissedProductUpdate() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PRODUCT_UPDATES_DISMISS_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DismissedProductUpdate;
    if (!parsed.updateId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function dismissProductUpdate(updateId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PRODUCT_UPDATES_DISMISS_STORAGE_KEY,
    JSON.stringify({
      updateId,
    } satisfies DismissedProductUpdate),
  );
}

export function isProductUpdateDismissed(
  updateId: string,
  dismissed: DismissedProductUpdate | null,
) {
  return dismissed?.updateId === updateId;
}
