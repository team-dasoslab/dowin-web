import { TeamDashboardMember } from "@/api/generated/dowin.schemas";
import { getRateTone } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/dashboard";
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
      className={`bg-white rounded-[24px] p-6 space-y-4 transition-colors ${
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
              <p className="text-sm font-bold text-zinc-900 truncate">
                {member.nickname}
              </p>
              {isMe ? (
                <Badge className="rounded-[12px] border border-primary/25 bg-primary/10 px-1.5 py-0 text-[10px] font-bold text-primary">
                  {tc("me")}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {hasScoreboard ? member.goalName : t("noScoreboardTitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-100 rounded-[16px] px-4 py-3">
        <DowinIcon name="domain-target-arrow" size="12px" className="text-zinc-400 flex-shrink-0" />
        <span className="truncate">
          {hasScoreboard ? member.lagMeasure : t("noScoreboardDesc")}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-zinc-900">
          <span>{t("weeklyAchievement")}</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-[8px] border-none ${getRateTone(weeklyAchievementRate)}`}
          >
            {hasScoreboard ? `${weeklyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-[11px] text-zinc-900">
          <span>{t("monthlyAchievement")}</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-[8px] border-none ${getRateTone(monthlyAchievementRate)}`}
          >
            {hasScoreboard ? `${monthlyAchievementRate}%` : tc("unsetTitle")}
          </Badge>
        </div>
      </div>
    </div>
  );
}
