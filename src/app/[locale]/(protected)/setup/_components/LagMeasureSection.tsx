import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import { useTranslations } from "next-intl";

interface LagMeasureSectionProps {
  isMutating: boolean;
  lagMeasure: string;
  setLagMeasure: (value: string) => void;
}

export function LagMeasureSection({
  isMutating,
  lagMeasure,
  setLagMeasure,
}: LagMeasureSectionProps) {
  const t = useTranslations("Setup");

  return (
    <Card
      className="p-6 md:p-8 space-y-6"
      data-coachmark="setup-lag"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-zinc-900">
            {t("lagMeasureQuestion")}
          </label>
        </div>
        <Input
          value={lagMeasure}
          disabled={isMutating}
          onChange={(e) => setLagMeasure(e.target.value)}
          placeholder={t("lagMeasurePlaceholder")}
          className="w-full rounded-content border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-base focus:border-primary outline-none transition-all placeholder:text-zinc-300"
          required
        />
      </div>
    </Card>
  );
}

