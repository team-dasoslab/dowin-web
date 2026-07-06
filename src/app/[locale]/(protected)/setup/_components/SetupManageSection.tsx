import { InlineSpinner } from "@/components/InlineSpinner";
import { ActionRow } from "@/components/ui/ActionRow";
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
      <ActionRow
        className="border-none rounded-[24px]"
        title={t("archiveLabel")}
        description={t("archiveDesc")}
        action={
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
        }
      />
    </div>
  );
}
