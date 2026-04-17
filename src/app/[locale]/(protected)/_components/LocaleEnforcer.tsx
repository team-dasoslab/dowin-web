"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleEnforcer() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const { data: response } = useGetUsersMe();

  const userData = response?.status === 200 ? response.data : undefined;
  const userLocale =
    userData && typeof userData === "object" && "locale" in userData
      ? String(userData.locale)
      : undefined;

  useEffect(() => {
    if (userLocale && userLocale !== currentLocale) {
      router.replace(pathname, { locale: userLocale as "ko" | "en" });
    }
  }, [userLocale, currentLocale, pathname, router]);

  return null;
}
