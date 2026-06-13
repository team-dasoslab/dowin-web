import { useTranslations } from "next-intl";

interface DashboardHeaderProps {
  nickname?: string | null;
}

export function DashboardHeader({
  nickname,
}: DashboardHeaderProps) {
  const t = useTranslations("Dashboard");

  return (
    <header className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black text-text-primary tracking-tight">
            {nickname ? t("userScoreboard", { nickname }) : t("myScoreboard")}
          </h1>
        </div>
      </div>
    </header>
  );
}
