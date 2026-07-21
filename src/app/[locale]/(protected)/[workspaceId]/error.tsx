"use client";

import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { ProtectedPageContainer } from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error("Workspace Error:", error);
  }, [error]);

  return (
    <ProtectedPageContainer>
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center mt-12 lg:mt-24">
        <EmptyStatePanel
          icon={<AlertCircle size={48} className="text-danger" />}
          title={t("errorOccurred")}
          description={t("errorDesc")}
          align="center"
          actions={
            <div className="flex justify-center w-full">
              <Button onClick={() => reset()} variant="solid-dark" size="hero" className="shadow-sm sm:w-auto min-w-[200px]">
                {t("retry")}
              </Button>
            </div>
          }
        />
      </div>
    </ProtectedPageContainer>
  );
}
