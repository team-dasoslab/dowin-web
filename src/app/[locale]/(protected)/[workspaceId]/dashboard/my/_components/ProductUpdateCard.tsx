import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import type { ProductUpdate } from "@/content/product-updates";
import { useTranslations } from "next-intl";

interface ProductUpdateCardProps {
  onDismiss: () => void;
  update: ProductUpdate;
}

export function ProductUpdateCard({
  onDismiss,
  update,
}: ProductUpdateCardProps) {
  const t = useTranslations("Dashboard");
  const updateT = useTranslations("ProductUpdates");

  return (
    <div className="overflow-hidden rounded-[24px] bg-surface">
      <div className="relative bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 dark:from-indigo-500/10 dark:via-surface dark:to-blue-500/10 px-5 py-6 sm:px-6">
        <Button
          type="button"
          onClick={onDismiss}
          variant="subtle"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[12px] p-0 border-none"
          aria-label={t("dismissUpdate")}
        >
          <DowinIcon name="action-dismiss" size="14px" />
        </Button>

        <div className="space-y-2.5 pr-10 sm:max-w-[84%] sm:pr-0">
          <div>
            <span className="inline-flex w-fit rounded-[8px] bg-primary/15 dark:bg-primary/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary dark:text-primary-light">
              {t("newFeatureNotice")}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-[20px] font-bold tracking-tight text-text-primary">
              {updateT(`updates.${update.id}.title`)}
            </h2>
            <p className="max-w-[520px] text-[14px] leading-relaxed text-text-secondary">
              {updateT(`updates.${update.id}.summary`)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
            <DowinIcon name="domain-calendar" size="12px" />
            <span>{update.publishedAt}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{updateT(`tags.${update.tag}`)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
