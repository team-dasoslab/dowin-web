import { InlineSpinner } from "@/components/InlineSpinner";
import { ActionRow } from "@/components/ui/ActionRow";
import { Button } from "@/components/ui/Button";
import { Archive } from "lucide-react";
import { useTranslations } from "next-intl";

interface SetupManageSectionProps {
  archive: () => Promise<boolean>;
  isArchivePending: boolean;
  isMutating: boolean;
}

export function SetupManageSection({
  archive,
  isArchivePending,
  isMutating,
}: SetupManageSectionProps) {
  const t = useTranslations("Setup");

  return (
    <div className="space-y-2">
      <ActionRow
        title={t("archiveLabel")}
        description={t("archiveDesc")}
        action={
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => {
              if (confirm(t("confirmArchive"))) {
                void archive();
              }
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-content border border-zinc-200 px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-[rgba(205,207,213,1)]"
          >
            {isArchivePending ? (
              <InlineSpinner
                size="sm"
                className="border-text-secondary/20 border-t-text-secondary"
              />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {isArchivePending ? t("archivingBtn") : t("archiveBtn")}
          </Button>
        }
      />
    </div>
  );
}
