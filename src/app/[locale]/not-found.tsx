"use client";

import { NotFoundPage } from "@/components/NotFoundPage";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const firstSegment = pathname.split("/")[1];
  const locale = firstSegment === "en" ? "en" : "ko";

  return <NotFoundPage locale={locale} homeHref={`/${locale}`} />;
}
