import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Zap } from "lucide-react";

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
  return (
    <Card
      className="overflow-hidden rounded-lg border border-border"
      data-coachmark="setup-goal"
    >
      <div className="flex items-center gap-2 border-b border-border bg-sub-background px-5 py-3">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold text-text-primary">가중목</span>
      </div>
      <div className="space-y-3 p-5">
        <label className="block text-xs font-bold text-text-secondary">
          가장 중요한 목표는 무엇인가요?
        </label>
        <Input
          value={goalName}
          disabled={isMutating}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder="예: 8주 안에 5km 완주하기"
          className="w-full rounded-lg border border-border bg-sub-background p-3 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
          required
        />
      </div>
    </Card>
  );
}
