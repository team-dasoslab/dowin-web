"use client";

import { usePutUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export function LocaleSwitcher() {
  const locale = useLocale() as "ko" | "en";
  const t = useTranslations("Profile");
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { mutate: updateProfile } = usePutUsersMe();

  const handleLocaleChange = (newLocale: "ko" | "en") => {
    if (newLocale === locale) return;

    // 1. Update DB preference
    updateProfile(
      { data: { locale: newLocale } },
      {
        onSuccess: () => {
          // 2. Switch URL
          router.replace(pathname, { locale: newLocale });
        },
        onError: () => {
          showToast("error", t("languageChangeFailed"));
        },
      },
    );
  };

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
