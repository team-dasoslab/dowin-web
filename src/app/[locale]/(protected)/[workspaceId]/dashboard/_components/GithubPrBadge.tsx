import { type GithubPrLink } from "@/api/generated/dowin.schemas";
import { GitMerge, GitPullRequest, GitPullRequestClosed } from "lucide-react";
import { useTranslations } from "next-intl";
import { badgeVariants } from "@/components/ui/Badge";

export function GithubPrBadge({ pr }: { pr: GithubPrLink }) {
  const t = useTranslations("Dashboard");

  let Icon = GitPullRequest;
  let variant: "success" | "primary" | "danger" = "success";
  let stateText = t("prStateOpen");

  if (pr.state === "MERGED") {
    Icon = GitMerge;
    variant = "primary"; // primary is purple in Dowin
    stateText = t("prStateMerged");
  } else if (pr.state === "CLOSED") {
    Icon = GitPullRequestClosed;
    variant = "danger";
    stateText = t("prStateClosed");
  }

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={badgeVariants({ variant, shape: "pill", className: "flex items-center gap-1 w-fit transition-opacity hover:opacity-80" })}
      onClick={(e) => e.stopPropagation()}
      title={stateText}
    >
      <Icon className="w-3 h-3" />
      <span>
        {pr.title} #{pr.number}
      </span>
    </a>
  );
}
