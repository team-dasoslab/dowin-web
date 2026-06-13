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
      className={`h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-semibold transition-transform ${
        isMutating
          ? "cursor-not-allowed bg-sub-background text-text-muted"
          : "bg-zinc-900 text-white hover:bg-zinc-800"
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
