import { Card } from "@/components/ui/Card";
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
    <Card className="p-6 md:p-8 space-y-6 border-none rounded-[24px]" data-coachmark="setup-goal">
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-bold text-zinc-900 tracking-tight">
            {t("goalQuestion")}
          </label>
        </div>
        <Input
          value={goalName}
          disabled={isMutating}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder={t("goalPlaceholder")}
          className="w-full rounded-[16px] border-none bg-[#F2F4F6] px-5 py-4 text-[17px] font-semibold text-zinc-900 focus:bg-[#E8F3FF] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400"
          required
        />
      </div>
    </Card>
  );
}
