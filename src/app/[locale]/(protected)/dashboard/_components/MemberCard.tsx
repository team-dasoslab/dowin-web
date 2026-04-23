import { TeamDashboardMember } from "@/api/generated/wig.schemas";
import { getRateTone } from "@/app/[locale]/(protected)/dashboard/_lib/dashboard";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TargetArrow20Regular } from "@fluentui/react-icons";
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
    <Card
      className={`bg-white border border-zinc-200 rounded-content p-6 space-y-4 transition-colors ${
        isMe
          ? "border-primary/40 ring-1 ring-primary/20"
          : "hover:border-zinc-300"
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
                <Badge className="rounded-content border border-primary/25 bg-primary/10 px-1.5 py-0 text-[10px] font-bold text-primary">
                  {tc("me")}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-text-secondary truncate">
              {hasScoreboard ? member.goalName : t("noScoreboardTitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-secondary bg-sub-background border border-border rounded-content px-3 py-2">
        <TargetArrow20Regular className="w-3 h-3 text-text-muted flex-shrink-0" />
        <span className="truncate">
          {hasScoreboard ? member.lagMeasure : t("noScoreboardDesc")}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>{t("weeklyAchievement")}</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-content border ${getRateTone(weeklyAchievementRate)}`}
          >
            {hasScoreboard ? `${weeklyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>{t("monthlyAchievement")}</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-content border ${getRateTone(monthlyAchievementRate)}`}
          >
            {hasScoreboard ? `${monthlyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
