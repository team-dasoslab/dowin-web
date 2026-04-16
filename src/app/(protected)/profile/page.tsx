"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  ProfileCoachmark,
  PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY,
} from "@/app/(protected)/profile/_components/ProfileCoachmark";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { NotificationSettingControl } from "@/app/(protected)/profile/_components/NotificationSettingControl";
import { TIME_OPTIONS, useNotificationSettings } from "@/app/(protected)/profile/_hooks/useNotificationSettings";
import { useProfileActions } from "@/app/(protected)/profile/_hooks/useProfileActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/context/ToastContext";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import {
  Bell,
  ChevronRight,
  Download,
  Edit2,
  Key,
  LogOut,
  Smartphone,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { showToast } = useToast();
  const hasHandledMissingUserRef = useRef(false);
  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();
  const { data: workspaceResponse, error: workspaceError } = useGetWorkspacesMe({
    query: {
      retry: false,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const workspace =
    !hasNoWorkspace && workspaceResponse?.status === 200
      ? workspaceResponse.data
      : null;
  const workspacePlanCode = workspace?.planCode ?? "FREE";
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const nickname = user?.nickname ?? "사용자";
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
    showToast("error", "프로필 정보를 불러오지 못해 홈으로 이동합니다.");
    router.replace("/dashboard/my");
  }, [isProfileLoading, router, showToast, user]);

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

  const menuGroups: { label: string; items: MenuItem[] }[] = [
    {
      label: "계정 설정",
      items: [
        {
          id: "nickname",
          icon: <Edit2 className="w-3.5 h-3.5" />,
          title: "닉네임 변경",
          description: "대시보드에 표시될 이름을 변경합니다.",
          danger: false,
          onClick: () => {
            void changeNickname();
          },
        },
        {
          id: "password",
          icon: <Key className="w-3.5 h-3.5" />,
          title: "비밀번호 변경",
          description: "계정 보안을 위해 비밀번호를 재설정합니다.",
          href: "/profile/password",
        },
        {
          id: "logout",
          icon: <LogOut className="w-3.5 h-3.5" />,
          title: "로그아웃",
          description: "현재 기기에서 세션을 종료합니다.",
          danger: false,
          onClick: () => {
            void logout();
          },
        },
        {
          id: "account-delete",
          icon: <Trash2 className="w-3.5 h-3.5" />,
          title: "서비스 탈퇴",
          description:
            "계정과 연결된 데이터를 삭제하고 로그인 화면으로 돌아갑니다.",
          danger: true,
          href: "/profile/delete-account",
        },
      ],
    },
    {
      label: "워크스페이스",
      items: hasWorkspace
        ? isWorkspaceAdmin
          ? [
              {
                id: "workspace-name",
                icon: <Edit2 className="w-3.5 h-3.5" />,
                title: "워크스페이스 이름 변경",
                description: "팀 공간 이름을 현재 운영 방식에 맞게 바꿉니다.",
                onClick: () => {
                  void changeWorkspaceName();
                },
              },
              {
                id: "members",
                icon: <Users className="w-3.5 h-3.5" />,
                title: "멤버 관리",
                description: "워크스페이스 멤버 조회와 퇴출을 관리합니다.",
                href: "/profile/members",
              },
              {
                id: "invites",
                icon: <Ticket className="w-3.5 h-3.5" />,
                title: "초대코드 관리",
                description: "초대코드 생성과 활성/비활성 상태를 관리합니다.",
                href: "/profile/invites",
              },
              {
                id: "workspace-delete",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                title: "워크스페이스 삭제",
                description:
                  "멤버, 점수판, 선행지표, 기록을 포함한 모든 데이터를 삭제합니다.",
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
                title: "워크스페이스 탈퇴",
                description:
                  "현재 워크스페이스에서 나가고 기록 화면으로 돌아갑니다.",
                danger: true,
                onClick: () => {
                  void leaveWorkspace();
                },
              },
            ]
        : [],
    },
    {
      label: "데이터",
      items:
        workspacePlanCode === "STANDARD"
          ? [
              {
                id: "export",
                icon: <Download className="w-3.5 h-3.5" />,
                title: "CSV 다운로드",
                description: "기간/지표를 선택해 내 기록을 CSV로 저장합니다.",
                href: "/profile/export",
              },
            ]
          : [],
    },
    {
      label: "알림 설정",
      items: [
        {
          id: "push-notification",
          icon: <Bell className="w-3.5 h-3.5" />,
          title: "개인 기록 리마인드",
          description: "매일 정해진 시간에 기록 리마인드 푸시 알림을 받습니다.",
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
      label: "앱 둘러보기",
      items: [
        {
          id: "updates",
          icon: <Sparkles className="w-3.5 h-3.5" />,
          title: "새 기능 모아보기",
          description: "최근 추가되거나 좋아진 기능을 한 번에 확인합니다.",
          href: "/updates",
        },
        {
          id: "install-guide-ios",
          icon: <Smartphone className="w-3.5 h-3.5" />,
          title: "iPhone 앱 설치 가이드",
          description: "Safari에서 홈 화면에 추가하는 순서를 안내합니다.",
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
              ? "닉네임을 변경하는 중입니다."
              : pendingAction === "workspace-name"
                ? "워크스페이스 이름을 변경하는 중입니다."
                : pendingAction === "workspace-leave"
                  ? "워크스페이스에서 탈퇴하는 중입니다."
                  : pendingAction === "workspace-delete"
                    ? "워크스페이스를 삭제하는 중입니다."
                  : pendingAction === "account-delete"
                    ? "계정을 삭제하는 중입니다."
                  : "로그아웃하는 중입니다."
          }
        />
      )}
      <div className="max-w-[560px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
          <p className="text-xs text-text-muted">내 프로필</p>
          <div className="w-8" /> {/* 우측 균형 맞춤 */}
        </header>

        {/* ── 프로필 카드 ── */}
        <Card className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <UserAvatar
            avatarKey={avatarKey}
            avatarSeed={nickname}
            alt={`${nickname} 아바타`}
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
              <div key={group.label} className="space-y-1.5">
                {/* 그룹 레이블 */}
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-0.5">
                  {group.label}
                </p>

                {group.label === "워크스페이스" && workspace ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white px-5 py-4">
                    <div className="flex flex-col min-w-0 text-left">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {workspace.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {isWorkspaceAdmin ? "워크스페이스 관리자" : "워크스페이스 멤버"}
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
