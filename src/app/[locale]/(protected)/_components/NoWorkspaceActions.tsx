import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useNativeApp } from "@/context/NativeAppContext";

export function NoWorkspaceActions() {
  const t = useTranslations("Common");
  const isNativeApp = useNativeApp();
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {!isNativeApp && (
        <Button
          asChild
          variant="hero"
          size="hero"
          className="w-full"
        >
          <Link href="/workspace/new">
            {t("createWorkspace")}
          </Link>
        </Button>
      )}

      <Button
        asChild
        className="flex items-center gap-2 rounded-button bg-surface border border-border px-5 py-3 text-sm font-bold text-text-primary"
      >
        <Link href="/workspace/join">
          {t("joinWorkspace")}
        </Link>
      </Button>
    </div>
  );
}
