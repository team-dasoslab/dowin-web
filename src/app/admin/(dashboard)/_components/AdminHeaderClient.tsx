"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAdminHeaderActions } from "@/app/admin/(dashboard)/_hooks/useAdminHeaderActions";

export default function AdminHeaderClient() {
  const pathname = usePathname();
  const { handleLogout } = useAdminHeaderActions();

  const navItems = [
    {
      href: "/admin/promotions",
      label: "마케팅 프로모션",
    },
    {
      href: "/admin/inquiries",
      label: "문의 처리 센터",
    },
    {
      href: "/admin/billing",
      label: "결제 지원 센터",
    },
    {
      href: "/admin/products",
      label: "상품 관리",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border shadow-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin/promotions" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-primary/10 text-primary">
              <Logo size="20px" className="text-primary" />
            </div>
            <div>
              <span className="text-[14px] font-black tracking-tight text-text-primary leading-none block">
                Dowin Admin
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-[14px] font-bold rounded-full transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-zinc-100 hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center">
          <Button onClick={handleLogout} variant="secondary" size="sm">
            로그아웃
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Row (visible only on small screens) */}
      <div className="sm:hidden border-t border-border bg-white/80 backdrop-blur-md overflow-x-auto hide-scrollbar">
        <nav className="flex items-center gap-2 p-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-4 py-2 text-[13px] font-bold rounded-full transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-zinc-100 hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
