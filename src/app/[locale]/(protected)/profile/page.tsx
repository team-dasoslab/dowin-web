"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
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
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <ProfileCoachmark
        isRunning={isCoachmarkRunning}
        setIsRunning={setIsCoachmarkRunning}
      />
      {isActionPending && (
        <LoadingOverlay
          variant="ios"
          message={
            pendingAction === "nickname"
              ? t("loadingNickname")
              : pendingAction === "workspace-name"
                ? t("loadingWorkspaceName")
                : pendingAction === "workspace-leave"
                  ? t("loadingWorkspaceLeave")
                  : pendingAction === "workspace-delete"
                    ? t("loadingWorkspaceDelete")
                    : pendingAction === "account-delete"
                      ? t("loadingAccountDelete")
                      : t("loadingLogout")
          }
        />
      )}
      <div className="max-w-[560px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
          <p className="text-xs text-text-muted">{t("header")}</p>
          <div className="w-8" /> {/* 우측 균형 맞춤 */}
        </header>

        {/* ── 프로필 카드 ── */}
        <Card className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <UserAvatar
            avatarKey={avatarKey}
            avatarSeed={nickname}
            alt={t("avatarAlt", { name: nickname })}
            size={44}
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                {nickname}
              </h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              @{customId}
              {workspace ? ` · ${workspace.name}` : ""}
            </p>
          </div>
        </Card>

        {/* ── 메뉴 그룹 ── */}
        <div className="space-y-6">
          {menuGroups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.id} className="space-y-1.5">
                {/* 그룹 레이블 */}
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-0.5">
                  {group.label}
                </p>

                {group.id === "workspace" && workspace ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white px-5 py-4">
                    <div className="flex flex-col min-w-0 text-left">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {workspace.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {isWorkspaceAdmin
                          ? t("workspaceAdmin")
                          : t("workspaceMember")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center h-6 rounded px-2 text-[10px] font-bold tracking-wide border ${
                        workspacePlanCode === "STANDARD"
                          ? "border-primary/20 bg-primary/5 text-primary"
                          : "border-border bg-sub-background text-text-secondary"
                      }`}
                    >
                      {workspacePlanCode}
                    </span>
                  </div>
                ) : null}

                {/* 아이템 목록 */}
                <div className="border border-border rounded-lg overflow-hidden">
                  {group.items.map((item, index) => {
                    const itemWrapperClassName =
                      index < group.items.length - 1
                        ? "border-b border-border"
                        : "";
                    const Content = (
                      <div className="flex items-center justify-between w-full px-5 py-4 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* 아이콘 */}
                          <div
                            className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.danger
                                ? "border-danger/20 bg-danger/5 text-danger"
                                : "border-border bg-sub-background text-text-muted"
                            }`}
                          >
                            {item.icon}
                          </div>

                          {/* 텍스트 */}
                          <div className="text-left min-w-0">
                            <p
                              className={`text-sm font-semibold ${
                                item.danger
                                  ? "text-danger"
                                  : "text-text-primary"
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.rightElement ? (
                          item.rightElement
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0 ml-3" />
                        )}
                      </div>
                    );

                    if (item.onClick) {
                      return (
                        <div key={item.id} className={itemWrapperClassName}>
                          <Button
                            disabled={isActionPending}
                            onClick={item.onClick}
                            className="w-full bg-white"
                          >
                            {Content}
                          </Button>
                        </div>
                      );
                    }

                    if (item.href) {
                      return (
                        <div key={item.id} className={itemWrapperClassName}>
                          <Button asChild className="block w-full bg-white">
                            <Link href={item.href}>{Content}</Link>
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className={`w-full bg-white transition-colors ${itemWrapperClassName}`}
                      >
                        {Content}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[560px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-sub-background" />
          <div className="h-36 rounded-2xl bg-sub-background" />
          <div className="h-28 rounded-2xl bg-sub-background" />
        </div>
      </div>
    </div>
  );
}
