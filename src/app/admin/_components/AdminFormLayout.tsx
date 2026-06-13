import Link from "next/link";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { ReactNode } from "react";

interface AdminFormLayoutProps {
  title: string;
  description: string;
  backHref: string;
  children: ReactNode;
}

export default function AdminFormLayout({
  title,
  description,
  backHref,
  children,
}: AdminFormLayoutProps) {
  return (
    <div className="space-y-8 animate-dowin-in max-w-2xl mx-auto">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-border text-zinc-600 transition-colors"
        >
          <DowinIcon name="nav-back" size="16px" />
        </Link>
        <div className="space-y-1.5">
          <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
            {title}
          </h1>
          <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
