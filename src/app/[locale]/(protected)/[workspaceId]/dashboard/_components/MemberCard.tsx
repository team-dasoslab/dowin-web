import { TeamDashboardMember } from "@/api/generated/dowin.schemas";
import { getRateVariant } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/dashboard";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Zap } from "lucide-react";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useNudgeMember } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useNudgeMember";

type MemberCardProps = {
  member: TeamDashboardMember;
  isMe?: boolean;
};

export function MemberCard({ member, isMe = false }: MemberCardProps) {
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");
  const { nudgeMember, isNudging } = useNudgeMember();

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

              {member.currentCheckinStreak && member.currentCheckinStreak > 0 ? (
                <Badge 
                  variant="primary"
                  shape="pill"
                  size="sm"
                  className="gap-0.5 px-1.5 border-primary/10"
                  title={t("dailyCheckinStreakTitle", { count: member.currentCheckinStreak })}
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>{member.currentCheckinStreak}</span>
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-text-muted truncate">
              {hasScoreboard ? member.goalName : t("noScoreboardTitle")}
            </p>
          </div>
        </div>

        {!isMe && (
          <Button 
            variant="outline" 
            size="control" 
            title={t("nudgeTitle", { name: member.nickname || tc("teamMember") })}
            disabled={isNudging}
            className="hover:bg-transparent"
            onClick={() => {
              const confirmed = window.confirm(t("nudgeConfirm", { name: member.nickname || tc("teamMember") }));
              if (confirmed && member.userId) {
                nudgeMember(member.userId, member.nickname || tc("teamMember"));
              }
            }}
          >
            {t("nudgeButton")}
          </Button>
        )}
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
          <div className="flex items-center gap-1.5">
            <Badge
              variant={getRateVariant(weeklyAchievementRate)}
              className="flex-shrink-0"
            >
              {hasScoreboard ? `${weeklyAchievementRate}%` : tc("unsetTitle")}
            </Badge>
          </div>
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
