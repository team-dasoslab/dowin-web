import {
  Activity,
  BarChart3,
  FolderArchive,
  Settings,
  User as UserIcon,
  Users,
  type LucideIcon,
} from "lucide-react";

export const MY_DASHBOARD_LINKS: {
  href: string;
  icon: LucideIcon;
  label: string;
  translationKey: string;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard", icon: Users, label: "팀 대시보드", translationKey: "teamDashboard" },
  { href: "/dashboard/my", icon: Activity, label: "나의 대시보드", translationKey: "myDashboard" },
  { href: "/report", icon: BarChart3, label: "주간 리포트", translationKey: "weeklyReport", adminOnly: true },
  { href: "/scoreboards", icon: FolderArchive, label: "점수판 보관함", translationKey: "scoreboardArchive" },
  { href: "/setup?mode=update", icon: Settings, label: "점수판 관리", translationKey: "manageScoreboard" },
  { href: "/profile", icon: UserIcon, label: "내 프로필", translationKey: "myProfile" },
];
