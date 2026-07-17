import { IconName } from "@/components/ui/DowinIcon";

export const getDashboardLinks = (workspaceId: string): {
  href: string;
  iconName: IconName;
  iconNameActive: IconName;
  label: string;
  translationKey: string;
  adminOnly?: boolean;
}[] => [
  {
    href: `/${workspaceId}/dashboard/my`,
    iconName: "nav-home",
    iconNameActive: "nav-home-active",
    label: "홈",
    translationKey: "myDashboard",
  },
  {
    href: `/${workspaceId}/dashboard`,
    iconName: "nav-team",
    iconNameActive: "nav-team-active",
    label: "팀 대시보드",
    translationKey: "teamDashboard",
  },
  {
    href: `/${workspaceId}/settings`,
    iconName: "nav-settings",
    iconNameActive: "nav-settings-active",
    label: "워크스페이스",
    translationKey: "settings",
  },
  {
    href: `/${workspaceId}/profile`,
    iconName: "nav-profile",
    iconNameActive: "nav-profile-active",
    label: "프로필",
    translationKey: "myProfile",
  },
];
