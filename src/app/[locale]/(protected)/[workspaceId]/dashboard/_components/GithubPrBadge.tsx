import { type GithubPrLink } from "@/api/generated/dowin.schemas";
import { GitPullRequestArrow } from "lucide-react";
import { useTranslations } from "next-intl";

export function GithubPrBadge({ pr }: { pr: GithubPrLink }) {
  const t = useTranslations("Dashboard");

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit flex flex-row items-center justify-center gap-1 ounded-[6px] bg-sub-background px-1.5 py-0.5 transition-colors hover:bg-border/60 rounded-md"
      onClick={(e) => e.stopPropagation()}
      title={t("prStateOpen")}
    >
        <GitPullRequestArrow className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-[13px] font-bold">
          {pr.title} #{pr.number}
        </span>
    </a>
  );
}
