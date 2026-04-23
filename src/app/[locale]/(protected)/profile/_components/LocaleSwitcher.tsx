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
    <div className="grid shrink-0 grid-cols-2 gap-1 rounded-lg border border-border bg-sub-background p-1">
      <button
        type="button"
        onClick={() => handleLocaleChange("ko")}
        className={`flex h-8 w-[4.25rem] items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[11px] font-bold leading-none transition-all ${
          locale === "ko"
            ? "bg-white text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        {t("languageKo")}
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={`flex h-8 w-[4.25rem] items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[11px] font-bold leading-none transition-all ${
          locale === "en"
            ? "bg-white text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        {t("languageEn")}
      </button>
    </div>
  );
}
