import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

interface SetupSubmitButtonProps {
  isEditMode: boolean;
  isMutating: boolean;
  isSubmitPending: boolean;
}

export function SetupSubmitButton({
  isEditMode,
  isMutating,
  isSubmitPending,
}: SetupSubmitButtonProps) {
  const t = useTranslations("Setup");

  return (
    <Button
      type="submit"
      disabled={isMutating}
      className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
        isMutating
          ? "cursor-not-allowed bg-primary/50 text-white"
          : "btn-linear-primary"
      }`}
    >
      {isSubmitPending ? (
        <InlineSpinner />
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          {isEditMode ? t("saveChanges") : t("createScoreboard")}
        </>
      )}
    </Button>
  );
}
