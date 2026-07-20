"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
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
import { useProfileGithubIntegration } from "@/app/[locale]/(protected)/profile/_hooks/useProfileGithubIntegration";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import { useActiveSectionScroll } from "@/hooks/useActiveSectionScroll";
import { Link, useRouter } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
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
  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe();
  const { data: workspaceResponse, error: workspaceError } = useGetWorkspacesMe({
    query: {
      retry: false,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const workspace =
    !hasNoWorkspace && workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const nickname = user?.nickname ?? t("defaultNickname");
  const customId = user?.customId ?? "";
  const avatarKey = user?.avatarKey ?? null;
  const isNativeApp = useNativeApp();
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const { dailySettings, isDailyLoading, isUpdatingDaily, refreshSettings, updateDailySettings } =
    useNotificationSettings();
  const { changeNickname, isActionPending, logout, pendingAction } = useProfileActions({
    nickname,
    workspace,
  });
  const {
    status: githubStatus,
    isGettingUrl,
    isDisconnecting,
    handleInstallUrl,
    handleDisconnectAccount,
  } = useProfileGithubIntegration();
  const isGithubConnected = githubStatus?.isConnected ?? false;

  useEffect(() => {
    if (isProfileLoading || user || hasHandledMissingUserRef.current) {
      return;
    }

    hasHandledMissingUserRef.current = true;
    showToast("error", t("profileLoadFailedDashboard"));
    router.replace(getWorkspacePath(workspaceId, "/dashboard/my"));
  }, [isProfileLoading, router, showToast, user, t, workspaceId]);

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
        {
          id: "theme",
          icon: <DowinIcon name="action-theme" className="w-4 h-4" />,
          title: t("themeTitle"),
          description: t("themeDesc"),
          rightElement: <ThemeToggle />,
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
      id: "integrations",
      label: t("integrationsSection", { fallback: "연동" }),
      items: [
        {
          id: "github",
          icon: (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/github-black.png" alt="GitHub" className="w-4 h-4 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/github-white.png"
                alt="GitHub"
                className="w-4 h-4 hidden dark:block"
              />
            </>
          ),
          title: isGithubConnected
            ? t("githubConnectedTitle", { fallback: "GitHub 계정 연동 완료" })
            : t("githubIntegrationTitle", { fallback: "GitHub 계정 연동" }),
          rightElement: isGithubConnected ? (
            <Button
              variant="secondary"
              size="sm"
              className="font-bold"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    t("githubDisconnectConfirm", {
                      fallback:
                        "Dowin에서 연동을 해제하더라도 GitHub에서 직접 앱을 해제해야 완전히 연결이 끊어집니다. 연동을 해제하시겠습니까?\n(확인 시 GitHub 설정 페이지가 새 창으로 열립니다.)",
                    }),
                  )
                ) {
                  const activeInstallation = githubStatus?.installations?.find(
                    (
                      i:
                        | import("@/api/generated/dowin.schemas").GithubUserInstallation
                        | { status: string; installationId: string },
                    ) => i.status === "ACTIVE",
                  );
                  if (!activeInstallation?.installationId) return;

                  const newWindow = window.open("about:blank", "_blank");
                  void handleDisconnectAccount(activeInstallation.installationId)
                    .then(() => {
                      if (newWindow) {
                        newWindow.location.href = "https://github.com/settings/installations";
                      } else {
                        window.open("https://github.com/settings/installations", "_blank");
                      }
                    })
                    .catch(() => {
                      if (newWindow) newWindow.close();
                    });
                }
              }}
            >
              {t("disconnect", { fallback: "연동 해제" })}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="font-bold"
              onClick={(e) => {
                e.stopPropagation();
                void handleInstallUrl();
              }}
            >
              {t("connect", { fallback: "연동하기" })}
            </Button>
          ),
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
                <span className="text-[11px] font-medium text-text-muted">
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
                    className="h-9 cursor-pointer rounded-[12px] border-none bg-sub-background px-3 text-center text-xs font-bold text-text-primary outline-none transition-all focus:bg-border disabled:cursor-not-allowed disabled:opacity-50"
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

  const [activeSection] = useActiveSectionScroll(menuGroups, "general");

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const coachmark = currentUrl.searchParams.get("coachmark");

    if (coachmark !== PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY) {
      return;
    }

    setIsCoachmarkRunning(true);
    currentUrl.searchParams.delete("coachmark");
    window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search);
  }, []);

  if (isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <ProfileCoachmark isRunning={isCoachmarkRunning} setIsRunning={setIsCoachmarkRunning} />
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
      {(isGettingUrl || isDisconnecting) && (
        <LoadingOverlay
          message={
            isGettingUrl
              ? t("loadingGithubUrl", { fallback: "GitHub 연결 준비 중..." })
              : t("disconnectingGithub", { fallback: "GitHub 연결 해제 중..." })
          }
        />
      )}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader title={t("title")} description={t("description")} />

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
              <div className="rounded-[24px] bg-surface px-4 py-4 flex items-center gap-4 sm:px-8 sm:py-8 sm:gap-6">
                <UserAvatar
                  avatarKey={avatarKey}
                  avatarSeed={nickname}
                  alt={t("avatarAlt", { name: nickname })}
                  size={52}
                  className="flex-shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">{nickname}</h2>
                  <p className="text-sm font-medium text-text-secondary mt-1">@{customId}</p>
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

                    <div className="rounded-[24px] overflow-hidden bg-surface">
                      {group.items.map((item) => (
                        <MenuItemRow key={item.id} item={item} isActionPending={isActionPending} />
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

function MenuItemRow({ item, isActionPending }: { item: MenuItem; isActionPending: boolean }) {
  const itemWrapperClassName = "";

  const Content = (
    <div className="flex w-full items-center justify-between gap-4 px-4 py-4 transition-colors sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={`w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
            item.danger ? "bg-danger/5 text-danger" : "bg-sub-background text-text-muted"
          }`}
        >
          {item.icon}
        </div>
        <div className="text-left min-w-0">
          <div
            className={`text-[14px] font-bold ${item.danger ? "text-danger" : "text-text-primary"}`}
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
          variant="ghost"
          className="block w-full text-left justify-start items-stretch rounded-none h-auto p-0 font-normal"
        >
          {Content}
        </Button>
      </div>
    );
  }

  if (item.href) {
    return (
      <div className={itemWrapperClassName}>
        <Link href={item.href} className="block w-full transition-colors hover:bg-sub-background">
          {Content}
        </Link>
      </div>
    );
  }

  return <div className={`w-full bg-surface ${itemWrapperClassName}`}>{Content}</div>;
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-border" />
        <div className="h-24 rounded-content bg-border" />
        <div className="space-y-4">
          <div className="h-44 rounded-content bg-border" />
          <div className="h-36 rounded-content bg-border" />
          <div className="h-28 rounded-content bg-border" />
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
