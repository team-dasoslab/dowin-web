import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";

export const useWeeklyTableActions = (
  createMemo: (content: string) => Promise<boolean>,
  onToggleCompose?: () => void,
) => {
  const t = useTranslations("Dashboard");
  const { showToast } = useToast();

  const handleComposeClick = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1599px)").matches
    ) {
      const content =
        window.prompt("메모 내용을 입력하세요.", "")?.trim() ?? "";

      if (!content) {
        return;
      }

      void (async () => {
        const isSuccess = await createMemo(content);

        if (isSuccess) {
          showToast("success", t("addedMemo"));
        }
      })();
      return;
    }

    onToggleCompose?.();
  };

  return { handleComposeClick };
};
