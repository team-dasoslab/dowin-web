import {
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
}[] = [
  { href: "/dashboard", icon: Users, label: "팀 대시보드", translationKey: "teamDashboard" },
  { href: "/scoreboards", icon: FolderArchive, label: "점수판 보관함", translationKey: "scoreboardArchive" },
  { href: "/setup?mode=update", icon: Settings, label: "점수판 관리", translationKey: "manageScoreboard" },
  { href: "/profile", icon: UserIcon, label: "내 프로필", translationKey: "myProfile" },
];
