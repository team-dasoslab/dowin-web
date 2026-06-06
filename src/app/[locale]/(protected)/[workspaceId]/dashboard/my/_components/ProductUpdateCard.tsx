import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProductUpdate } from "@/content/product-updates";
import { Link } from "@/i18n/routing";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { getWorkspacePath } from "@/lib/client/workspace-path";

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
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;

  return (
    <div className="overflow-hidden rounded-[24px] bg-white">
      <div className="relative bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 px-5 py-6 sm:px-6">
        <Button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[12px] bg-black/5 text-zinc-500 hover:bg-black/10 transition-colors border-none"
          aria-label={t("dismissUpdate")}
        >
          <DowinIcon name="action-dismiss" size="14px" />
        </Button>

        <div className="space-y-2.5 pr-10 sm:max-w-[84%] sm:pr-0">
          <div>
            <span className="inline-flex w-fit rounded-[8px] bg-[#E8F3FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("newFeatureNotice")}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-[20px] font-bold tracking-tight text-zinc-900">
              {updateT(`updates.${update.id}.title`)}
            </h2>
            <p className="max-w-[520px] text-[14px] leading-relaxed text-zinc-600">
              {updateT(`updates.${update.id}.summary`)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
            <DowinIcon name="domain-calendar" size="12px" />
            <span>{update.publishedAt}</span>
            <span className="text-border">•</span>
            <span>{updateT(`tags.${update.tag}`)}</span>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-2 pt-0.5">
            <Button
              asChild
              className="justify-center rounded-[14px] bg-primary h-10 px-5 text-[13px] font-bold text-white transition-all active:scale-95 shadow-none"
            >
              <Link href={update.ctaHref}>{updateT("ctaLabel")}</Link>
            </Button>
            <Button
              asChild
              className="justify-center rounded-[14px] bg-[#F2F4F6] h-10 px-5 text-[13px] font-bold text-zinc-700 transition-all active:scale-95 border-none shadow-none hover:bg-zinc-200/50"
            >
              <Link href={getWorkspacePath(workspaceId, "/profile/updates")}>{t("viewAllUpdates")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
