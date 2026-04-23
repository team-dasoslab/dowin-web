import { Button } from "@/components/ui/Button";
import { Add20Regular, ArrowEnterLeft20Regular } from "@fluentui/react-icons";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function NoWorkspaceActions() {
  const t = useTranslations("Common");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        className="btn-linear-primary flex items-center gap-2 rounded-button px-5 py-3 text-sm font-bold"
      >
        <Link href="/workspace/new">
          <Add20Regular className="w-4 h-4" />
          {t("createWorkspace")}
        </Link>
      </Button>

      <Button
        asChild
        className="flex items-center gap-2 rounded-button bg-white border border-border px-5 py-3 text-sm font-bold text-text-primary hover:border-[rgba(205,207,213,1)]"
      >
        <Link href="/workspace/join">
          <ArrowEnterLeft20Regular className="w-4 h-4" />
          {t("joinWorkspace")}
        </Link>
      </Button>
    </div>
  );
}
