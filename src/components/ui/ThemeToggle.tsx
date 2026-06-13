"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Profile");

  // Avoid Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-[100px] rounded-[12px] bg-sub-background animate-pulse" />
    );
  }

  return (
    <div className="flex shrink-0">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="h-9 min-w-[100px] cursor-pointer rounded-[12px] border-none bg-sub-background px-3 text-center text-xs font-bold text-text-primary outline-none transition-all focus:bg-border"
      >
        <option value="light">{t("themeLight")}</option>
        <option value="dark">{t("themeDark")}</option>
        <option value="system">{t("themeSystem")}</option>
      </select>
    </div>
  );
}
