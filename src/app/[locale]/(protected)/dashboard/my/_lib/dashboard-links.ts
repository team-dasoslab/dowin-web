import { IconName } from "@/components/ui/DowinIcon";

export const MY_DASHBOARD_LINKS: {
  href: string;
  iconName: IconName;
  iconNameActive: IconName;
  label: string;
  translationKey: string;
  adminOnly?: boolean;
}[] = [
  {
    href: "/dashboard",
    iconName: "nav-team",
    iconNameActive: "nav-team-active",
    label: "팀 대시보드",
    translationKey: "teamDashboard",
  },
  {
    href: "/dashboard/my",
    iconName: "nav-dashboard",
    iconNameActive: "nav-dashboard-active",
    label: "나의 대시보드",
    translationKey: "myDashboard",
  },
  {
    href: "/report",
    iconName: "nav-report",
    iconNameActive: "nav-report-active",
    label: "주간 리포트",
    translationKey: "weeklyReport",
    adminOnly: true,
  },
  {
    href: "/scoreboards",
    iconName: "nav-archive",
    iconNameActive: "nav-archive-active",
    label: "점수판 보관함",
    translationKey: "scoreboardArchive",
  },
  {
    href: "/setup?mode=update",
    iconName: "nav-settings",
    iconNameActive: "nav-settings-active",
    label: "점수판 관리",
    translationKey: "manageScoreboard",
  },
  {
    href: "/workspace/settings",
    iconName: "nav-settings",
    iconNameActive: "nav-settings-active",
    label: "워크스페이스 설정",
    translationKey: "workspaceSettings",
    adminOnly: true,
  },
  {
    href: "/profile",
    iconName: "nav-profile",
    iconNameActive: "nav-profile-active",
    label: "내 프로필",
    translationKey: "myProfile",
  },
];
