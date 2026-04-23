"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { LocaleSwitcher } from "@/app/[locale]/(protected)/profile/_components/LocaleSwitcher";
import { NotificationSettingControl } from "@/app/[locale]/(protected)/profile/_components/NotificationSettingControl";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import {
  PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY,
  ProfileCoachmark,
} from "@/app/[locale]/(protected)/profile/_components/ProfileCoachmark";
import {
  TIME_OPTIONS,
  useNotificationSettings,
} from "@/app/[locale]/(protected)/profile/_hooks/useNotificationSettings";
import { useProfileActions } from "@/app/[locale]/(protected)/profile/_hooks/useProfileActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card } from "@/components/ui/Card";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/context/ToastContext";
import { Link, useRouter } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import {
  Bell,
  ChevronRight,
  Download,
  Edit2,
  Key,
  Languages,
  LogOut,
  MessageCircle,
  CreditCard,
  Smartphone,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const { showToast } = useToast();
  const hasHandledMissingUserRef = useRef(false);
  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();
  const { data: workspaceResponse, error: workspaceError } = useGetWorkspacesMe(
    {
      query: {
        retry: false,
      },
    },
  );

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const workspace =
    !hasNoWorkspace && workspaceResponse?.status === 200
      ? workspaceResponse.data
      : null;
  const workspacePlanCode = workspace?.planCode ?? "FREE";
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const nickname = user?.nickname ?? t("defaultNickname");
  const customId = user?.customId ?? "";
  const avatarKey = user?.avatarKey ?? null;
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const hasWorkspace = workspace !== null;
  const isWorkspaceAdmin = hasWorkspace && user?.role === "ADMIN";
  const {
    dailySettings,
    isDailyLoading,
    isUpdatingDaily,
    refreshSettings,
    updateDailySettings,
  } = useNotificationSettings();
  const {
    changeNickname,
    changeWorkspaceName,
    deleteWorkspace,
    isActionPending,
    leaveWorkspace,
    logout,
    pendingAction,
  } = useProfileActions({
    nickname,
    workspace,
  });

  useEffect(() => {
    if (isProfileLoading || user || hasHandledMissingUserRef.current) {
      return;
    }

    hasHandledMissingUserRef.current = true;
    showToast("error", t("profileLoadFailedDashboard"));
    router.replace("/dashboard/my");
  }, [isProfileLoading, router, showToast, user, t]);

  const [activeSection, setActiveSection] = useState<string>("general");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const menuGroups: { id: string; label: string; items: MenuItem[] }[] = [
    {
      id: "general",
      label: t("generalSection"),
      items: [
        {
          id: "language",
          icon: <Languages className="w-3.5 h-3.5" />,
          title: t("languageTitle"),
          description: t("languageDesc"),
          rightElement: <LocaleSwitcher />,
        },
      ],
    },
    {
      id: "account",
      label: t("accountSection"),
      items: [
        {
          id: "nickname",
          icon: <Edit2 className="w-3.5 h-3.5" />,
          title: t("nicknameChangeTitle"),
          description: t("nicknameChangeDesc"),
          danger: false,
          onClick: () => {
            void changeNickname();
          },
        },
        {
          id: "password",
          icon: <Key className="w-3.5 h-3.5" />,
          title: t("passwordChangeTitle"),
          description: t("passwordChangeDesc"),
          href: "/profile/password",
        },
        {
          id: "logout",
          icon: <LogOut className="w-3.5 h-3.5" />,
          title: t("logoutTitle"),
          description: t("logoutDesc"),
          danger: false,
          onClick: () => {
            void logout();
          },
        },
        {
          id: "account-delete",
          icon: <Trash2 className="w-3.5 h-3.5" />,
          title: t("deleteAccountTitle"),
          description: t("deleteAccountDesc"),
          danger: true,
          href: "/profile/delete-account",
        },
      ],
    },
    {
      id: "workspace",
      label: t("workspaceSection"),
      items: hasWorkspace
        ? isWorkspaceAdmin
          ? [
              {
                id: "billing",
                icon: <CreditCard className="w-3.5 h-3.5" />,
                title: t("billingTitle"),
                description: t("billingDesc"),
                href: "/profile/billing",
              },
              {
                id: "workspace-name",
                icon: <Edit2 className="w-3.5 h-3.5" />,
                title: t("changeWorkspaceName"),
                description: t("changeWorkspaceNameDesc"),
                onClick: () => {
                  void changeWorkspaceName();
                },
              },
              {
                id: "members",
                icon: <Users className="w-3.5 h-3.5" />,
                title: t("manageMembers"),
                description: t("manageMembersDesc"),
                href: "/profile/members",
              },
              {
                id: "invites",
                icon: <Ticket className="w-3.5 h-3.5" />,
                title: t("manageInvites"),
                description: t("manageInvitesDesc"),
                href: "/profile/invites",
              },
              {
                id: "workspace-delete",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                title: t("workspaceDelete"),
                description: t("workspaceDeleteDescFull"),
                danger: true,
                onClick: () => {
                  void deleteWorkspace();
                },
              },
            ]
          : [
              {
                id: "workspace-leave",
                icon: <LogOut className="w-3.5 h-3.5" />,
                title: t("workspaceLeave"),
                description: t("workspaceLeaveDescFull"),
                danger: true,
                onClick: () => {
                  void leaveWorkspace();
                },
              },
            ]
        : [],
    },
    {
      id: "data",
      label: t("dataSection"),
      items:
        workspacePlanCode === "STANDARD"
          ? [
              {
                id: "export",
                icon: <Download className="w-3.5 h-3.5" />,
                title: t("csvDownload"),
                description: t("csvDownloadDesc"),
                href: "/profile/export",
              },
            ]
          : [],
    },
    {
      id: "notifications",
      label: t("notificationSection"),
      items: [
        {
          id: "push-notification",
          icon: <Bell className="w-3.5 h-3.5" />,
          title: t("pushReminder"),
          description: t("pushReminderDesc"),
          rightElement: (
            <NotificationSettingControl
              isSubscribed={isPushSubscribed}
              dailyReminderTime={dailySettings?.dailyReminderTime ?? "21:00"}
              disabled={isDailyLoading || isUpdatingDaily}
              timeOptions={TIME_OPTIONS}
              onSubscriptionChange={(next) => {
                setIsPushSubscribed(next);
                if (next) {
                  void refreshSettings();
                }
              }}
              onDailyReminderTimeChange={(time) => {
                void updateDailySettings(time);
              }}
            />
          ),
        },
      ],
    },
    {
      id: "app",
      label: t("appSection"),
      items: [
        {
          id: "updates",
          icon: <Sparkles className="w-3.5 h-3.5" />,
          title: t("newFeatures"),
          description: t("newFeaturesDesc"),
          href: "/updates",
        },
        {
          id: "install-guide-ios",
          icon: <Smartphone className="w-3.5 h-3.5" />,
          title: t("installGuideIos"),
          description: t("installGuideIosDesc"),
          href: "/install-guide",
        },
        {
          id: "contact",
          icon: <MessageCircle className="w-3.5 h-3.5" />,
          title: t("contactUs"),
          description: t("contactUsDesc"),
          onClick: () => {
            window.open("https://tally.so/r/2ExbKb", "_blank");
          },
        },
      ],
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      // 현재 스크롤 위치에 따른 섹션 감지
      const scrollPosition = window.scrollY + 150; // 헤더 높이 등을 고려한 오프셋

      let currentSectionId = activeSection;
      const sortedSections = Object.entries(sectionRefs.current)
        .filter(([, el]) => el !== null)
        .sort((a, b) => (a[1]?.offsetTop ?? 0) - (b[1]?.offsetTop ?? 0));

      for (const [id, el] of sortedSections) {
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // 초기 로드 시 한 번 실행
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeSection]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const coachmark = currentUrl.searchParams.get("coachmark");

    if (coachmark !== PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY) {
      return;
    }

    setIsCoachmarkRunning(true);
    currentUrl.searchParams.delete("coachmark");
    window.history.replaceState(
      {},
      "",
      currentUrl.pathname + currentUrl.search,
    );
  }, []);

  if (isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-zinc-50/50 font-pretendard">
      <ProfileCoachmark
        isRunning={isCoachmarkRunning}
        setIsRunning={setIsCoachmarkRunning}
      />
      {isActionPending && (
        <LoadingOverlay
          message={
            pendingAction === "nickname"
              ? t("loadingNickname")
              : pendingAction === "workspace-name"
                ? t("loadingWorkspaceName")
                : pendingAction === "LOGOUT"
                  ? t("loadingLogout")
                  : t("processing")
          }
        />
      )}
      <ProtectedPageContainer className="space-y-12">
        <ProtectedPageHeader title={t("title")} description={t("description")} />

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* ── 좌측 사이드바 내비게이션 ── */}
          <aside className="w-full lg:w-[240px] lg:sticky lg:top-12 space-y-1">
            {menuGroups
              .filter((group) => group.items.length > 0)
              .map((group) => {
                const isActive = activeSection === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      const element = document.getElementById(group.id);
                      if (element) {
                        const headerOffset = 100;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth"
                        });
                      }
                    }}
                    className={`w-full flex items-center px-4 py-2 rounded-button text-[14px] font-bold transition-all text-left ${
                      isActive 
                        ? "text-primary" 
                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive && <div className="w-1 h-4 bg-primary rounded-full" />}
                      <span className={isActive ? "" : "pl-4"}>{group.label}</span>
                    </div>
                  </button>
                );
              })}
          </aside>

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="flex-1 space-y-12 max-w-[800px]">
            {/* 프로필 요약 카드 */}
            <div className="space-y-4">
              <Card className="border border-zinc-200 rounded-content px-8 py-8 flex items-center gap-6 bg-white">
                <UserAvatar
                  avatarKey={avatarKey}
                  avatarSeed={nickname}
                  alt={t("avatarAlt", { name: nickname })}
                  size={64}
                  className="flex-shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                    {nickname}
                  </h2>
                  <p className="text-sm font-medium text-zinc-500 mt-1">
                    @{customId}
                  </p>
                </div>
              </Card>

              {workspace?.isOverFreeMemberLimit && (
                <WorkspaceOverLimitBanner
                  freeMemberLimit={workspace.freeMemberLimit}
                  isAdmin={isWorkspaceAdmin}
                  memberCount={workspace.memberCount}
                />
              )}
            </div>

            {/* 설정 그룹들 */}
            <div className="space-y-16 pb-[60vh]">
              {menuGroups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <section 
                    key={group.id} 
                    id={group.id} 
                    ref={(el) => { sectionRefs.current[group.id] = el; }}
                    className="space-y-5 scroll-mt-28"
                  >
                    <div className="flex items-center gap-4 px-1">
                      <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-wider">
                        {group.label}
                      </h3>
                      <div className="h-px flex-1 bg-zinc-200/60" />
                    </div>

                    {group.id === "workspace" && workspace && (
                      <div className="mb-4 rounded-content border border-zinc-200 bg-white px-8 py-7 flex items-center justify-between">
                        <div className="flex flex-col min-w-0 text-left">
                          <p className="text-lg font-bold text-zinc-900 truncate tracking-tight">
                            {workspace.name}
                          </p>
                          <p className="text-xs font-medium text-zinc-500 mt-1">
                            {isWorkspaceAdmin ? t("workspaceAdmin") : t("workspaceMember")}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center h-6 rounded-button px-2.5 text-[10px] font-black tracking-wider border ${
                            workspacePlanCode === "STANDARD"
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-zinc-200 bg-zinc-50 text-zinc-500"
                          }`}
                        >
                          {workspacePlanCode}
                        </span>
                      </div>
                    )}

                    <div className="border border-zinc-200 rounded-content overflow-hidden bg-white">
                      {group.items.map((item, index) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          isLast={index === group.items.length - 1}
                          isActionPending={isActionPending}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function MenuItemRow({
  item,
  isLast,
  isActionPending,
}: {
  item: MenuItem;
  isLast: boolean;
  isActionPending: boolean;
}) {
  const itemWrapperClassName = isLast ? "" : "border-b border-zinc-100";

  const Content = (
    <div className="flex items-center justify-between w-full px-6 py-5 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-9 h-9 rounded-button border flex items-center justify-center flex-shrink-0 ${
            item.danger
              ? "border-red-100 bg-red-50 text-red-500"
              : "border-zinc-100 bg-zinc-50 text-zinc-400"
          }`}
        >
          {item.icon}
        </div>
        <div className="text-left min-w-0">
          <p
            className={`text-[14px] font-bold ${
              item.danger ? "text-red-600" : "text-zinc-900"
            }`}
          >
            {item.title}
          </p>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            {item.description}
          </p>
        </div>
      </div>
      {item.rightElement ? (
        item.rightElement
      ) : (
        <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0 ml-3" />
      )}
    </div>
  );

  if (item.onClick) {
    return (
      <div className={itemWrapperClassName}>
        <button
          disabled={isActionPending}
          onClick={item.onClick}
          className="w-full bg-white text-left"
        >
          {Content}
        </button>
      </div>
    );
  }

  if (item.href) {
    return (
      <div className={itemWrapperClassName}>
        <Link href={item.href} className="block w-full bg-white">
          {Content}
        </Link>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white ${itemWrapperClassName}`}>
      {Content}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-sub-background" />
        <div className="h-24 rounded-content bg-sub-background" />
        <div className="space-y-4">
          <div className="h-44 rounded-content bg-sub-background" />
          <div className="h-36 rounded-content bg-sub-background" />
          <div className="h-28 rounded-content bg-sub-background" />
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
