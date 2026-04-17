import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface GoalSectionProps {
  goalName: string;
  isMutating: boolean;
  setGoalName: (value: string) => void;
}

export function GoalSection({
  goalName,
  isMutating,
  setGoalName,
}: GoalSectionProps) {
  const t = useTranslations("Setup");

  return (
    <Card
      className="overflow-hidden rounded-lg border border-border"
      data-coachmark="setup-goal"
    >
      <div className="flex items-center gap-2 border-b border-border bg-sub-background px-5 py-3">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold text-text-primary">
          {t("wigShort")}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <label className="block text-xs font-bold text-text-secondary">
          {t("goalQuestion")}
        </label>
        <Input
          value={goalName}
          disabled={isMutating}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder={t("goalPlaceholder")}
          className="w-full rounded-lg border border-border bg-sub-background p-3 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
          required
        />
      </div>
    </Card>
  );
}
