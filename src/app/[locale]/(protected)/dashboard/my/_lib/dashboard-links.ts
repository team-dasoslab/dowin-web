import {
  Archive20Filled,
  ChartMultiple20Filled,
  DataTreemap20Filled,
  People20Filled,
  Person20Filled,
  Settings20Filled,
} from "@fluentui/react-icons";

export const MY_DASHBOARD_LINKS: {
  href: string;
  icon: typeof People20Filled;
  iconFilled: typeof People20Filled;
  label: string;
  translationKey: string;
  adminOnly?: boolean;
}[] = [
  {
    href: "/dashboard",
    icon: People20Filled,
    iconFilled: People20Filled,
    label: "팀 대시보드",
    translationKey: "teamDashboard",
  },
  {
    href: "/dashboard/my",
    icon: DataTreemap20Filled,
    iconFilled: DataTreemap20Filled,
    label: "나의 대시보드",
    translationKey: "myDashboard",
  },
  {
    href: "/report",
    icon: ChartMultiple20Filled,
    iconFilled: ChartMultiple20Filled,
    label: "주간 리포트",
    translationKey: "weeklyReport",
    adminOnly: true,
  },
  {
    href: "/scoreboards",
    icon: Archive20Filled,
    iconFilled: Archive20Filled,
    label: "점수판 보관함",
    translationKey: "scoreboardArchive",
  },
  {
    href: "/setup?mode=update",
    icon: Settings20Filled,
    iconFilled: Settings20Filled,
    label: "점수판 관리",
    translationKey: "manageScoreboard",
  },
  {
    href: "/profile",
    icon: Person20Filled,
    iconFilled: Person20Filled,
    label: "내 프로필",
    translationKey: "myProfile",
  },
];
