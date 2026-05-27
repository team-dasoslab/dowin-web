"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LocaleSwitcher } from "@/app/[locale]/(protected)/profile/_components/LocaleSwitcher";
import { NotificationSettingControl } from "@/app/[locale]/(protected)/profile/_components/NotificationSettingControl";
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
import { useNativeApp } from "@/context/NativeAppContext";
import { Link, useRouter } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
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
  const isNativeApp = useNativeApp();
  const router = useRouter();
  const workspaceId = useParams().workspaceId as string | undefined;
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
  const {
    dailySettings,
    isDailyLoading,
    isUpdatingDaily,
    refreshSettings,
    updateDailySettings,
  } = useNotificationSettings();
  const {
    changeNickname,
    isActionPending,
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
    router.replace(getWorkspacePath(workspaceId, "/dashboard/my"));
  }, [isProfileLoading, router, showToast, user, t, workspaceId]);

  const [activeSection, setActiveSection] = useState<string>("general");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const menuGroups: { id: string; label: string; items: MenuItem[] }[] = [
    {
      id: "general",
      label: t("generalSection"),
      items: [
        {
          id: "language",
          icon: <DowinIcon name="domain-language" className="w-4 h-4" />,
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
          icon: <DowinIcon name="action-edit" className="w-4 h-4" />,
          title: t("nicknameChangeTitle"),
          description: t("nicknameChangeDesc"),
          danger: false,
          onClick: () => {
            void changeNickname();
          },
        },
        {
          id: "password",
          icon: <DowinIcon name="auth-key" className="w-4 h-4" />,
          title: t("passwordChangeTitle"),
          description: t("passwordChangeDesc"),
          href: getWorkspacePath(workspaceId, "/profile/password"),
        },
        {
          id: "logout",
          icon: <DowinIcon name="auth-sign-out" className="w-4 h-4" />,
          title: t("logoutTitle"),
          description: t("logoutDesc"),
          danger: false,
          onClick: () => {
            void logout();
          },
        },
        {
          id: "account-delete",
          icon: <DowinIcon name="action-delete" className="w-4 h-4" />,
          title: t("deleteAccountTitle"),
          description: t("deleteAccountDesc"),
          danger: true,
          href: getWorkspacePath(workspaceId, "/profile/delete-account"),
        },
      ],
    },

    {
      id: "data",
      label: t("dataSection"),
      items:
        !isNativeApp && workspacePlanCode === "STANDARD"
          ? [
              {
                id: "export",
                icon: <DowinIcon name="action-download" className="w-4 h-4" />,
                title: t("csvDownload"),
                description: t("csvDownloadDesc"),
                href: getWorkspacePath(workspaceId, "/profile/export"),
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
          icon: <DowinIcon name="status-bell" className="w-4 h-4" />,
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
          icon: <DowinIcon name="status-announcement" className="w-4 h-4" />,
          title: t("newFeatures"),
          description: t("newFeaturesDesc"),
          href: "/updates",
        },
        /* {
          id: "install-guide-ios",
          icon: <Smartphone20Regular className="w-4 h-4" />,
          title: t("installGuideIos"),
          description: t("installGuideIosDesc"),
          href: "/install-guide",
        }, */
        {
          id: "contact",
          icon: <DowinIcon name="domain-chat" className="w-4 h-4" />,
          title: t("contactUs"),
          description: t("contactUsDesc"),
          href: getWorkspacePath(workspaceId, "/profile/contact"),
        },
      ],
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;

      // 현재 스크롤 위치에 따른 섹션 감지
      const scrollPosition = container.scrollTop + 150; // 헤더 높이 등을 고려한 오프셋

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

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll, { passive: true });
    // 초기 로드 시 한 번 실행
    handleScroll();

    return () => {
      container?.removeEventListener("scroll", handleScroll);
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
    <div className="min-h-screen bg-zinc-50/50">
      <ProfileCoachmark
        isRunning={isCoachmarkRunning}
        setIsRunning={setIsCoachmarkRunning}
      />
      {isActionPending && (
        <LoadingOverlay
          message={
            pendingAction === "nickname"
              ? t("loadingNickname")
              : pendingAction === "LOGOUT"
                  ? t("loadingLogout")
                  : t("processing")
          }
        />
      )}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={t("title")}
          description={t("description")}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          {/* ── 좌측 사이드바 내비게이션 ── */}
          <aside className="scrollbar-none sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-y border-zinc-200/60 bg-sub-background/95 px-4 py-2 backdrop-blur lg:top-12 lg:z-auto lg:mx-0 lg:block lg:w-[240px] lg:space-y-1 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            {menuGroups
              .filter((group) => group.items.length > 0)
              .map((group) => {
                const isActive = activeSection === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      const element = document.getElementById(group.id);
                        const container = document.getElementById("main-scroll-container");
                        if (container && element) {
                          const headerOffset = 100;
                          const elementPosition = element.offsetTop;
                          const offsetPosition = elementPosition - headerOffset;
                          container.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth",
                          });
                        }
                    }}
                    className={`flex shrink-0 items-center rounded-button px-3 py-2 text-left text-[13px] font-bold transition-all lg:w-full lg:px-4 lg:text-[14px] ${
                      isActive
                        ? "text-primary"
                        : "text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <div className="hidden w-1 h-4 bg-primary rounded-full lg:block" />
                      )}
                      <span className={isActive ? "" : "lg:pl-4"}>
                        {group.label}
                      </span>
                    </div>
                  </button>
                );
              })}
          </aside>

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12">
            {/* 프로필 요약 카드 */}
            <div className="space-y-4">
              <Card className="border border-zinc-200 rounded-content px-4 py-4 flex items-center gap-4 bg-white sm:px-8 sm:py-8 sm:gap-6">
                <UserAvatar
                  avatarKey={avatarKey}
                  avatarSeed={nickname}
                  alt={t("avatarAlt", { name: nickname })}
                  size={52}
                  className="flex-shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">
                    {nickname}
                  </h2>
                  <p className="text-sm font-medium text-text-secondary mt-1">
                    @{customId}
                  </p>
                </div>
              </Card>


            </div>

            {/* 설정 그룹들 */}
            <div className="space-y-8 pb-24 lg:space-y-16 lg:pb-[60vh]">
              {menuGroups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <section
                    key={group.id}
                    id={group.id}
                    ref={(el) => {
                      sectionRefs.current[group.id] = el;
                    }}
                    className="space-y-5 scroll-mt-28"
                  >
                    <SectionHeader title={group.label} className="mb-4" />



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
    <div className="flex w-full items-center justify-between gap-4 px-4 py-4 transition-colors sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={`w-9 h-9 rounded-button border flex items-center justify-center flex-shrink-0 ${
            item.danger
              ? "border-danger/10 bg-danger/5 text-danger"
              : "border-border/50 bg-sub-background text-text-muted"
          }`}
        >
          {item.icon}
        </div>
        <div className="text-left min-w-0">
          <p
            className={`text-[14px] font-bold ${
              item.danger ? "text-danger" : "text-text-primary"
            }`}
          >
            {item.title}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">{item.description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {item.rightElement ? (
          item.rightElement
        ) : (
          <DowinIcon name="nav-chevron-right" className="w-4 h-4 text-text-muted/50" />
        )}
      </div>
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
    <div className={`w-full bg-white ${itemWrapperClassName}`}>{Content}</div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50">
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
