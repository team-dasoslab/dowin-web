"use client";

import {
  usePostAuthLogout,
  usePutAuthPassword,
} from "@/api/generated/auth/auth";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import {
  getGetUsersMeQueryKey,
  useGetUsersMe,
  usePutUsersMe,
} from "@/api/generated/profile/profile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import PushSubscriptionManager from "@/components/PushSubscriptionManager";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import { validatePassword } from "@/domain/auth/validation";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Edit2,
  Key,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();
  const updateNicknameMutation = usePutUsersMe();
  const changePasswordMutation = usePutAuthPassword();
  const logoutMutation = usePostAuthLogout();

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const pushUserId = user?.id != null ? String(user.id) : null;

  if (isProfileLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const nickname = user.nickname ?? "사용자";
  const customId = user.customId ?? "";

  const handleLogout = async () => {
    try {
      const response = await logoutMutation.mutateAsync();
      if (response.status !== 204) {
        throw response;
      }
    } catch {
      // Continue logout flow even when server-side logout fails.
    } finally {
      queryClient.clear();
      window.location.replace("/");
    }
  };

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
          onClick: async () => {
            const next = prompt("새로운 닉네임을 입력하세요:", nickname);

            if (!next) {
              return;
            }

            try {
              const response = await updateNicknameMutation.mutateAsync({
                data: {
                  nickname: next,
                },
              });

              if (response.status !== 200) {
                throw response;
              }

              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: getGetUsersMeQueryKey(),
                }),
                queryClient.invalidateQueries({
                  queryKey: getGetDashboardTeamQueryKey(undefined),
                }),
              ]);
              showToast("success", "닉네임이 변경되었습니다.");
            } catch (error) {
              showToast(
                "error",
                getApiErrorMessage(error, "닉네임 변경에 실패했습니다."),
              );
            }
          },
        },
        {
          id: "password",
          icon: <Key className="w-3.5 h-3.5" />,
          title: "비밀번호 변경",
          description: "계정 보안을 위해 비밀번호를 재설정합니다.",
          danger: false,
          onClick: async () => {
            const currentPw = prompt("현재 비밀번호를 입력하세요:")?.trim();
            if (!currentPw) {
              showToast("error", "현재 비밀번호를 입력해주세요.");
              return;
            }

            const newPw = prompt("새로운 비밀번호를 입력하세요:")?.trim();
            if (!newPw) {
              showToast("error", "새 비밀번호를 입력해주세요.");
              return;
            }

            if (!validatePassword(newPw)) {
              showToast(
                "error",
                "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
              );
              return;
            }

            try {
              const response = await changePasswordMutation.mutateAsync({
                data: {
                  currentPassword: currentPw,
                  newPassword: newPw,
                },
              });

              if (response.status !== 200) {
                throw response;
              }

              showToast(
                "success",
                response.data.message ||
                  "비밀번호가 성공적으로 변경되었습니다.",
              );
            } catch (error) {
              showToast(
                "error",
                getApiErrorMessage(error, "비밀번호 변경에 실패했습니다."),
              );
            }
          },
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
          rightElement: pushUserId ? (
            <PushSubscriptionManager userId={pushUserId} variant="toggle" />
          ) : null,
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
            if (confirm("로그아웃할까요?")) {
              void handleLogout();
            }
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
      <div className="max-w-[560px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <Button
            asChild
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors"
          >
            <Link href="/dashboard/my">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <p className="text-xs text-text-muted">내 프로필</p>
          <div className="w-8" /> {/* 우측 균형 맞춤 */}
        </header>

        {/* ── 프로필 카드 ── */}
        <Card className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
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
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              {/* 그룹 레이블 */}
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-0.5">
                {group.label}
              </p>

              {/* 아이템 목록 */}
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {group.items.map((item) => {
                  const Content = (
                    <div className="flex items-center justify-between w-full px-5 py-4 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* 아이콘 */}
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.danger
                              ? "border-danger/20 bg-danger/5 text-danger"
                              : "border-border bg-sub-background text-text-muted group-hover:border-[rgba(205,207,213,1)]"
                          }`}
                        >
                          {item.icon}
                        </div>

                        {/* 텍스트 */}
                        <div className="text-left min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              item.danger ? "text-danger" : "text-text-primary"
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
                      <Button
                        key={item.id}
                        onClick={item.onClick}
                        className="w-full bg-white hover:bg-sub-background"
                      >
                        {Content}
                      </Button>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="w-full bg-white transition-colors"
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
