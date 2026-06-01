import { IconName } from "@/components/ui/DowinIcon";
import { publicRuntimeConfig } from "@/config/public-runtime-config";

export const getDashboardLinks = (workspaceId: string): {
  href: string;
  iconName: IconName;
  iconNameActive: IconName;
  label: string;
  translationKey: string;
  adminOnly?: boolean;
}[] => [
  {
    href: `/${workspaceId}/dashboard`,
    iconName: "nav-team",
    iconNameActive: "nav-team-active",
    label: "팀 대시보드",
    translationKey: "teamDashboard",
  },
  {
    href: `/${workspaceId}/dashboard/my`,
    iconName: "nav-dashboard",
    iconNameActive: "nav-dashboard-active",
    label: "나의 대시보드",
    translationKey: "myDashboard",
  },
  ...(publicRuntimeConfig.isDevelopment
    ? [
        {
          href: `/${workspaceId}/report`,
          iconName: "nav-report" as IconName,
          iconNameActive: "nav-report-active" as IconName,
          label: "주간 리포트",
          translationKey: "weeklyReport",
          adminOnly: true,
        },
      ]
    : []),
  {
    href: `/${workspaceId}/scoreboards`,
    iconName: "nav-archive",
    iconNameActive: "nav-archive-active",
    label: "점수판 보관함",
    translationKey: "scoreboardArchive",
  },
  {
    href: `/${workspaceId}/setup?mode=update`,
    iconName: "action-edit",
    iconNameActive: "action-edit-active",
    label: "점수판 관리",
    translationKey: "manageScoreboard",
  },
  {
    href: `/${workspaceId}/workspace/settings`,
    iconName: "nav-settings",
    iconNameActive: "nav-settings-active",
    label: "워크스페이스 설정",
    translationKey: "workspaceSettings",
  },
  {
    href: `/${workspaceId}/profile`,
    iconName: "nav-profile",
    iconNameActive: "nav-profile-active",
    label: "내 프로필",
    translationKey: "myProfile",
  },
];
