import { InlineSpinner } from "@/components/InlineSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface SetupManageSectionProps {
  archive: () => Promise<boolean>;
  isArchivePending: boolean;
}

export function SetupManageSection({
  archive,
  isArchivePending,
}: SetupManageSectionProps) {
  const t = useTranslations("Setup");

  return (
    <div className="space-y-2">
      <Card radius="xl" padding="lg" className="border-none bg-surface">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              {t("archiveLabel")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("archiveDesc")}
            </p>
          </div>
          <div className="shrink-0 sm:ml-4">
            <Button
              type="button"
              disabled={isArchivePending}
              onClick={() => {
                if (confirm(t("confirmArchive"))) {
                  archive();
                }
              }}
              variant="subtle"
              size="sm"
              className="font-bold"
            >
              {isArchivePending ? (
                <InlineSpinner
                  size="sm"
                  className="border-text-secondary/20 border-t-text-secondary"
                />
              ) : null}
              {isArchivePending ? t("archivingBtn") : t("archiveBtn")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
