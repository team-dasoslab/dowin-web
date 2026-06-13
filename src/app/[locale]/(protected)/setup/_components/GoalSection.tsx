
import { Input } from "@/components/ui/Input";
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
    <div className="bg-surface p-6 md:p-8 space-y-6 rounded-[24px]" data-coachmark="setup-goal">
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-bold text-text-primary tracking-tight">
            {t("goalQuestion")}
          </label>
        </div>
        <Input
          value={goalName}
          disabled={isMutating}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder={t("goalPlaceholder")}
          className="h-11 w-full rounded-[12px] border-none bg-sub-background px-4 text-[15px] font-semibold text-text-primary outline-none transition-colors placeholder:text-text-muted focus:bg-surface focus:ring-4 focus:ring-primary/5"
          required
        />
      </div>
    </div>
  );
}
