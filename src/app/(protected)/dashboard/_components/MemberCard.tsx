import { TeamDashboardMember } from "@/api/generated/wig.schemas";
import { getRateTone } from "@/app/(protected)/dashboard/_lib/dashboard";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Target } from "lucide-react";

type MemberCardProps = {
  member: TeamDashboardMember;
};

export function MemberCard({ member }: MemberCardProps) {
  const weeklyAchievementRate =
    member.weeklyAchievementRate ?? member.achievementRate ?? 0;
  const monthlyAchievementRate = member.monthlyAchievementRate ?? 0;
  const hasScoreboard = member.hasScoreboard ?? false;

  return (
    <Card className="bg-white border border-border rounded-lg p-5 space-y-4 hover:border-[rgba(205,207,213,1)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            avatarKey={member.avatarKey}
            alt={`${member.nickname ?? "사용자"} 아바타`}
            size={32}
            className="flex-shrink-0"
            fallbackClassName="rounded-md"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {member.nickname}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {hasScoreboard ? member.goalName : "활성 점수판 없음"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-secondary bg-sub-background border border-border rounded px-3 py-2">
        <Target className="w-3 h-3 text-text-muted flex-shrink-0" />
        <span className="truncate">
          {hasScoreboard
            ? member.lagMeasure
            : "점수판을 만들면 팀 대시보드에 집계됩니다."}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>주간 달성률</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${getRateTone(weeklyAchievementRate)}`}
          >
            {hasScoreboard ? `${weeklyAchievementRate}%` : "미설정"}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-[11px] text-text-primary">
          <span>월간 달성률</span>
          <Badge
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${getRateTone(monthlyAchievementRate)}`}
          >
            {hasScoreboard ? `${monthlyAchievementRate}%` : "미설정"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
