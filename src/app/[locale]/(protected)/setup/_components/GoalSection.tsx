import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { WigIcon } from "@/components/ui/WigIcon";
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
      className="p-6 md:p-8 space-y-6"
      data-coachmark="setup-goal"
    >
      <div className="space-y-4">
        <div className="w-10 h-10 bg-primary/10 rounded-content flex items-center justify-center">
          <WigIcon name="domain-flash-active" size="20px" className="text-primary" />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-900">
            {t("goalQuestion")}
          </label>
        </div>
        <Input
          value={goalName}
          disabled={isMutating}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder={t("goalPlaceholder")}
          className="w-full rounded-content border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-base focus:border-primary outline-none transition-all placeholder:text-zinc-300"
          required
        />
      </div>
    </Card>
  );
}
