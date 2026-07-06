"use client";

import { useLocaleSwitcherActions } from "@/app/[locale]/(protected)/profile/_hooks/useLocaleSwitcherActions";
import { useLocale, useTranslations } from "next-intl";

export function LocaleSwitcher() {
  const locale = useLocale() as "ko" | "en";
  const t = useTranslations("Profile");
  const { handleLocaleChange } = useLocaleSwitcherActions(locale);

  return (
    <div className="flex shrink-0">
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value as "ko" | "en")}
        className="h-9 min-w-[100px] cursor-pointer rounded-[12px] border-none bg-sub-background px-3 text-center text-xs font-bold text-text-primary outline-none transition-all focus:bg-border"
      >
        <option value="ko">{t("languageKo")}</option>
        <option value="en">{t("languageEn")}</option>
      </select>
    </div>
  );
}
