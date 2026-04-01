"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useProfileActions } from "@/app/(protected)/profile/_hooks/useProfileActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import PushSubscriptionManager from "@/components/PushSubscriptionManager";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/context/ToastContext";
import {
  Bell,
  ChevronRight,
  Download,
  Edit2,
  Image as ImageIcon,
  Key,
  LogOut,
  Smartphone,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const { data: workspaceResponse } = useGetWorkspacesMe({
    query: {
      retry: false,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const nickname = user?.nickname ?? "사용자";
  const customId = user?.customId ?? "";
  const avatarKey = user?.avatarKey ?? null;
  const isWorkspaceAdmin = user?.role === "ADMIN";
  const {
    changeNickname,
    changePassword,
    changeWorkspaceName,
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
    showToast("error", "프로필 정보를 불러오지 못해 홈으로 이동합니다.");
    router.replace("/dashboard/my");
  }, [isProfileLoading, router, showToast, user]);

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
          id: "avatar",
          icon: <ImageIcon className="w-3.5 h-3.5" />,
          title: "프로필 아이콘 변경",
          description: "마음에 드는 아이콘을 선택해 내 프로필에 적용합니다.",
          href: "/profile/avatar",
        },
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
          danger: false,
          onClick: () => {
            void changePassword();
          },
        },
      ],
    },
    {
      label: "워크스페이스",
      items: isWorkspaceAdmin
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
          ]
        : [],
    },
    {
      label: "데이터",
      items: [
        {
          id: "export",
          icon: <Download className="w-3.5 h-3.5" />,
          title: "CSV 다운로드",
          description: "기간/지표를 선택해 내 기록을 CSV로 저장합니다.",
          href: "/profile/export",
        },
      ],
    },
    {
      label: "알림 설정",
      items: [
        {
          id: "push-notification",
          icon: <Bell className="w-3.5 h-3.5" />,
          title: "매일 밤 9시 알림",
          description: "리드 지표 기록을 잊지 않도록 푸시 알림을 보냅니다.",
          rightElement: user ? (
            <PushSubscriptionManager variant="toggle" />
          ) : null,
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
    {
      label: "세션",
      items: [
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
      ],
    },
    // {
    //   label: "위험 구역",
    //   items: [
    //     {
    //       id: "delete",
    //       icon: <Trash2 className="w-3.5 h-3.5 text-danger" />,
    //       title: "서비스 탈퇴",
    //       description: "모든 데이터가 삭제되며 복구할 수 없습니다.",
    //       danger: true,
    //       onClick: () => {
    //         if (confirm("정말 탈퇴하시겠습니까? 기록이 모두 사라집니다.")) {
    //           void handleLogout();
    //         }
    //       },
    //     },
    //   ],
    // },
  ];

  return (
    <div className="min-h-screen bg-background font-pretendard">
      {isActionPending && (
        <LoadingOverlay
          variant="ios"
          message={
            pendingAction === "nickname"
              ? "닉네임을 변경하는 중입니다."
              : pendingAction === "workspace-name"
                ? "워크스페이스 이름을 변경하는 중입니다."
                : pendingAction === "password"
                  ? "비밀번호를 변경하는 중입니다."
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
            alt={`${nickname} 아바타`}
            size={44}
            className="flex-shrink-0"
            fallbackClassName="rounded-lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                {nickname}
              </h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">@{customId}</p>
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
