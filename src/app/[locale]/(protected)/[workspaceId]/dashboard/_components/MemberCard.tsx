import { TeamDashboardMember } from "@/api/generated/dowin.schemas";
import { getRateVariant } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/dashboard";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

type MemberCardProps = {
  member: TeamDashboardMember;
  isMe?: boolean;
};

export function MemberCard({ member, isMe = false }: MemberCardProps) {
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");

  const weeklyAchievementRate =
    member.weeklyAchievementRate ?? member.achievementRate ?? 0;
  const monthlyAchievementRate = member.monthlyAchievementRate ?? 0;
  const hasScoreboard = member.hasScoreboard ?? false;

  return (
    <div
      className={`bg-surface rounded-[24px] p-6 space-y-4 transition-colors ${
        isMe
          ? "ring-1 ring-primary/20"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            avatarKey={member.avatarKey}
            avatarSeed={member.nickname}
            alt={`${member.nickname ?? "사용자"} 아바타`}
            size={32}
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-text-primary truncate">
                {member.nickname}
              </p>
              {isMe ? (
                <Badge variant="primary" size="sm" shape="pill" className="shrink-0">
                  {tc("me")}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-text-muted truncate">
              {hasScoreboard ? member.goalName : t("noScoreboardTitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted bg-sub-background rounded-[16px] px-4 py-3">
        <DowinIcon name="domain-target-arrow" size="12px" className="text-text-muted flex-shrink-0" />
        <span className="truncate">
          {hasScoreboard ? member.lagMeasure : t("noScoreboardDesc")}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>{t("weeklyAchievement")}</span>
          <Badge
            variant={getRateVariant(weeklyAchievementRate)}
            className="flex-shrink-0"
          >
            {hasScoreboard ? `${weeklyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>{t("monthlyAchievement")}</span>
          <Badge
            variant={getRateVariant(monthlyAchievementRate)}
            className="flex-shrink-0"
          >
            {hasScoreboard ? `${monthlyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
      </div>
    </div>
  );
}
