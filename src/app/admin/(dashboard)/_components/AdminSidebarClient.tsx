"use client";

import { usePostAdminAuthLogout } from "@/api/generated/admin-auth/admin-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default function AdminSidebarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = usePostAdminAuthLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore
    }
    router.push("/admin/login");
  };

  const navItems = [
    {
      href: "/admin",
      label: "어드민 홈",
    },
    {
      href: "/admin/inquiries",
      label: "문의 처리 센터",
    },
    {
      href: "/admin/billing",
      label: "결제 지원 센터",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 border border-border rounded-content flex items-center justify-center bg-white">
            <Logo size="24px" className="text-text-primary" />
          </div>
          <div>
            <span className="text-[14px] font-black tracking-tight text-text-primary leading-none block">
              Dowin
            </span>
          </div>
        </Link>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-button transition-all ${
                  isActive
                    ? "bg-text-primary text-white"
                    : "text-text-secondary"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-border bg-sub-background/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-border text-text-primary rounded-button transition-all text-[13px] font-bold"
        >
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
