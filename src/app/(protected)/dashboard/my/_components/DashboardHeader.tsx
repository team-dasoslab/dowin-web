import { MY_DASHBOARD_LINKS } from "@/app/(protected)/dashboard/my/_lib/dashboard-links";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface DashboardHeaderProps {
  nickname: string | null;
  workspaceName?: string;
}

export function DashboardHeader({
  nickname,
  workspaceName,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-text-muted">{workspaceName}</p>
          <h1 className="truncate text-sm font-bold text-text-primary">
            {nickname ? `${nickname}님의 점수판` : "나의 점수판"}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MY_DASHBOARD_LINKS.map(({ href, icon: Icon, label }) => (
          <Button
            key={href}
            asChild
            className="flex min-w-fit flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:border-[rgba(205,207,213,1)] sm:flex-none"
          >
            <Link href={href}>
              <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span>{label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </header>
  );
}
