import { type GithubPrLink } from "@/api/generated/dowin.schemas";
import { GitMerge, GitPullRequest, GitPullRequestClosed } from "lucide-react";
import { useTranslations } from "next-intl";

export function GithubPrBadge({ pr }: { pr: GithubPrLink }) {
  const t = useTranslations("Dashboard");

  let Icon = GitPullRequest;
  let colorClass = "text-success bg-success/10 border-success/20";
  let stateText = t("prStateOpen");

  if (pr.state === "MERGED") {
    Icon = GitMerge;
    colorClass = "text-purple-500 bg-purple-500/10 border-purple-500/20";
    stateText = t("prStateMerged");
  } else if (pr.state === "CLOSED") {
    Icon = GitPullRequestClosed;
    colorClass = "text-danger bg-danger/10 border-danger/20";
    stateText = t("prStateClosed");
  }

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition-opacity hover:opacity-80 ${colorClass}`}
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
