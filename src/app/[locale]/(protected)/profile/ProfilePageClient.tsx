"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";
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
import { useNativeApp } from "@/context/NativeAppContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/routing";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  wrapOnMobile?: boolean;
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
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
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const nickname = user?.nickname ?? t("defaultNickname");
  const customId = user?.customId ?? "";
  const avatarKey = user?.avatarKey ?? null;
  const isNativeApp = useNativeApp();
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
      items: [],
    },
    {
      id: "notifications",
      label: t("notificationSection"),
      items: [
        {
          id: "push-notification",
          icon: <DowinIcon name="status-bell" className="w-4 h-4" />,
          title: (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>{t("pushReminder")}</span>
              {!isNativeApp && (
                <span className="text-[11px] font-medium text-zinc-500">
                  ({t("NotificationControl.appOnly")})
                </span>
              )}
            </div>
          ),
          rightElement: (
            <NotificationSettingControl
              disabled={isDailyLoading || isUpdatingDaily}
              onSubscriptionChange={(next) => {
                setIsPushSubscribed(next);
                if (next) {
                  void refreshSettings();
                }
              }}
            />
          ),
        },
        ...(isPushSubscribed
          ? [
              {
                id: "push-notification-time",
                icon: <DowinIcon name="status-timer" className="w-4 h-4" />,
                title: t("reminderTime"),
                rightElement: (
                  <select
                    value={dailySettings?.dailyReminderTime ?? "21:00"}
                    disabled={isDailyLoading || isUpdatingDaily}
                    onChange={(event) => {
                      void updateDailySettings(event.target.value);
                    }}
                    className="h-9 cursor-pointer rounded-[12px] border-none bg-zinc-100 px-3 text-center text-xs font-bold text-text-primary outline-none transition-all focus:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]
          : []),
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
          href: getWorkspacePath(workspaceId, "/profile/updates"),
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
    <div className="min-h-screen bg-zinc-100">
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
          <PageSidebarNav
            items={menuGroups
              .filter((group) => group.items.length > 0)
              .map((group) => ({ id: group.id, label: group.label }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12">
            {/* 프로필 요약 카드 */}
            <div className="space-y-4">
              <div className="rounded-[24px] bg-white px-4 py-4 flex items-center gap-4 sm:px-8 sm:py-8 sm:gap-6">
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
              </div>


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
                    <SectionHeader title={group.label} />



                    <div className="rounded-[24px] overflow-hidden bg-white">
                      {group.items.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
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
  isActionPending,
}: {
  item: MenuItem;
  isActionPending: boolean;
}) {
  const itemWrapperClassName = "";

  const Content = (
    <div className="flex w-full items-center justify-between gap-4 px-4 py-4 transition-colors sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={`w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
            item.danger
              ? "bg-danger/5 text-danger"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {item.icon}
        </div>
        <div className="text-left min-w-0">
          <div
            className={`text-[14px] font-bold ${
              item.danger ? "text-danger" : "text-text-primary"
            }`}
          >
            {item.title}
          </div>
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
        <Button
          disabled={isActionPending}
          onClick={item.onClick}
          className="block w-full text-left transition-colors hover:bg-zinc-50 justify-start items-stretch rounded-none h-auto p-0 font-normal"
        >
          {Content}
        </Button>
      </div>
    );
  }

  if (item.href) {
    return (
      <div className={itemWrapperClassName}>
        <Link href={item.href} className="block w-full transition-colors hover:bg-zinc-50">
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
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-zinc-200" />
        <div className="h-24 rounded-content bg-zinc-200" />
        <div className="space-y-4">
          <div className="h-44 rounded-content bg-zinc-200" />
          <div className="h-36 rounded-content bg-zinc-200" />
          <div className="h-28 rounded-content bg-zinc-200" />
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
