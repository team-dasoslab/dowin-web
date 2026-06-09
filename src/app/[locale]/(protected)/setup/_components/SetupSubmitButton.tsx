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
      className={`flex w-full items-center justify-center gap-2 rounded-[16px] py-4 text-[17px] font-bold transition-all ${
        isMutating
          ? "cursor-not-allowed bg-primary/50 text-white"
          : "bg-primary text-white hover:bg-primary/90"
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
