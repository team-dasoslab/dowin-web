"use client";

import { useMockData } from "@/context/MockDataContext";
import {
  ArrowLeft,
  ChevronRight,
  Edit2,
  Key,
  LogOut,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, updateProfile, logout } = useMockData();
  const router = useRouter();

  if (!user) return null;

  const menuItems = [
    {
      id: "nickname",
      icon: <Edit2 className="w-4 h-4" />,
      title: "닉네임 변경",
      description: "대시보드에 표시될 이름을 변경합니다.",
      onClick: () => {
        const next = prompt("새로운 닉네임을 입력하세요:", user.nickname);
        if (next) updateProfile(next);
      },
    },
    {
      id: "password",
      icon: <Key className="w-4 h-4" />,
      title: "비밀번호 변경",
      description: "계정 보안을 위해 비밀번호를 재설정합니다.",
      onClick: () =>
        alert(
          "보안을 위해 비밀번호 변경 링크가 등록된 메일로 발송됩니다. (프로토타입 기능)",
        ),
    },
    {
      id: "logout",
      icon: <LogOut className="w-4 h-4" />,
      title: "로그아웃",
      description: "현재 기기에서 계정 세션을 종료합니다.",
      onClick: logout,
      danger: false,
    },
    {
      id: "delete",
      icon: <Trash2 className="w-4 h-4 text-danger" />,
      title: "탈퇴하기",
      description: "모든 데이터가 삭제되며 복구할 수 없습니다.",
      onClick: () => {
        if (confirm("정말 탈퇴하시겠습니까? 기록이 모두 사라집니다.")) {
          logout();
          router.push("/login");
        }
      },
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background font-pretendard p-4 md:p-12">
      <div className="max-w-[600px] mx-auto space-y-10 animate-linear-in">
        <nav>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            돌아가기
          </Link>
        </nav>

        <header className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20">
            <User className="w-10 h-10" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                {user.nickname}
              </h1>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md border border-primary/20 mt-1">
                관리자
              </span>
            </div>
          </div>
        </header>

        <section className="card-linear overflow-hidden border-border bg-white rounded-2xl shadow-sm">
          <div className="divide-y divide-border">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full p-6 flex items-center justify-between hover:bg-sub-background transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-white shadow-sm transition-colors group-hover:border-primary/20 group-hover:bg-primary/[0.02]`}
                  >
                    {item.icon}
                  </div>
                  <div className="text-left space-y-0.5">
                    <div
                      className={`text-sm font-bold ${item.danger ? "text-danger" : "text-text-primary"}`}
                    >
                      {item.title}
                    </div>
                    <div className="text-[11px] text-text-muted tracking-wide font-medium">
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/40 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
