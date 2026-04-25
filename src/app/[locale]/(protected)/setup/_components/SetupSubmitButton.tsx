import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface SetupSubmitButtonProps {
  isEditMode: boolean;
  isMutating: boolean;
  isSubmitPending: boolean;
  formId?: string;
}

export function SetupSubmitButton({
  isEditMode,
  isMutating,
  isSubmitPending,
  formId,
}: SetupSubmitButtonProps) {
  const t = useTranslations("Setup");

  return (
    <Button
      type="submit"
      form={formId}
      disabled={isMutating}
      className={`flex w-full items-center justify-center gap-2 rounded-button py-3 text-sm font-bold transition-all ${
        isMutating
          ? "cursor-not-allowed bg-primary/50 text-white"
          : "btn-dowin-primary"
      }`}
    >
      {isSubmitPending ? (
        <InlineSpinner />
      ) : isEditMode ? (
        t("saveChanges")
      ) : (
        t("createScoreboard")
      )}
    </Button>
  );
}
