"use client";

import { usePutUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  const locale = useLocale() as "ko" | "en";
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
          showToast(
            "error",
            locale === "ko"
              ? "언어 변경에 실패했습니다."
              : "Failed to change language.",
          );
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-1 bg-sub-background border border-border rounded-lg p-1">
      <button
        onClick={() => handleLocaleChange("ko")}
        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
          locale === "ko"
            ? "bg-white text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => handleLocaleChange("en")}
        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
          locale === "en"
            ? "bg-white text-primary shadow-sm border border-border"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        English
      </button>
    </div>
  );
}
