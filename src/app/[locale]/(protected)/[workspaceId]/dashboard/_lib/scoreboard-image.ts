import type { TeamDashboardMember } from "@/api/generated/dowin.schemas";

export function getSafeImageFilename(input: {
  nickname?: string | null;
  weekStart?: string | null;
}): string {
  const safeNickname = (input.nickname || "User")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");

  const dateStr = input.weekStart || "date";

  return `dowin-${safeNickname}-${dateStr}-scoreboard.png`;
}

export function getLeadMeasureProgress(
  leadMeasure: NonNullable<TeamDashboardMember["leadMeasures"]>[number],
): {
  achieved: number;
  total: number;
  rate: number;
} {
  const achieved = leadMeasure.achieved ?? 0;
  const total = leadMeasure.total ?? 0;

  if (total <= 0) {
    return { achieved: 0, total: 0, rate: 0 };
  }

  // Cap rate at 100% even if achieved > total
  const rate = Math.min(Math.round((achieved / total) * 100), 100);

  return {
    achieved,
    total,
    rate,
  };
}
