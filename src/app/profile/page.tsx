"use client";

import PushSubscriptionManager from "@/components/PushSubscriptionManager";
import { useMockData } from "@/context/MockDataContext";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Edit2,
  Key,
  LogOut,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const { user, updateProfile, logout } = useMockData();
  const router = useRouter();

  if (!user) return null;

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
            const next = prompt("새로운 닉네임을 입력하세요:", user.nickname);
            if (next) updateProfile(next);
          },
        },
        {
          id: "password",
          icon: <Key className="w-3.5 h-3.5" />,
          title: "비밀번호 변경",
          description: "계정 보안을 위해 비밀번호를 재설정합니다.",
          danger: false,
          onClick: () =>
            alert(
              "보안을 위해 비밀번호 변경 링크가 등록된 메일로 발송됩니다. (프로토타입)",
            ),
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
          rightElement: (
            <PushSubscriptionManager userId={user.id} variant="toggle" />
          ),
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
          onClick: logout,
        },
      ],
    },
    {
      label: "위험 구역",
      items: [
        {
          id: "delete",
          icon: <Trash2 className="w-3.5 h-3.5 text-danger" />,
          title: "서비스 탈퇴",
          description: "모든 데이터가 삭제되며 복구할 수 없습니다.",
          danger: true,
          onClick: () => {
            if (confirm("정말 탈퇴하시겠습니까? 기록이 모두 사라집니다.")) {
              logout();
              router.push("/");
            }
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[560px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard/my"
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <p className="text-xs text-text-muted">내 프로필</p>
          <div className="w-8" /> {/* 우측 균형 맞춤 */}
        </header>

        {/* ── 프로필 카드 ── */}
        <section className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                {user.nickname}
              </h1>
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20">
                멤버
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">@{user.customId}</p>
          </div>
        </section>

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
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className="w-full bg-white hover:bg-sub-background"
                      >
                        {Content}
                      </button>
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
