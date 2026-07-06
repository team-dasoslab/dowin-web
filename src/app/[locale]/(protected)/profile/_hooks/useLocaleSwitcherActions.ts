import { usePutUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export const useLocaleSwitcherActions = (locale: "ko" | "en") => {
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

  return { handleLocaleChange };
};
