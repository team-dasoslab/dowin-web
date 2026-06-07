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
      className="p-6 md:p-8 space-y-6 border-none rounded-[24px]"
      data-coachmark="setup-lag"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-bold text-zinc-900 tracking-tight">
            {t("lagMeasureQuestion")}
          </label>
        </div>
        <Input
          value={lagMeasure}
          disabled={isMutating}
          onChange={(e) => setLagMeasure(e.target.value)}
          placeholder={t("lagMeasurePlaceholder")}
          className="w-full rounded-[16px] border-none bg-zinc-100 px-5 py-4 text-[17px] font-semibold text-zinc-900 focus:bg-[#E8F3FF] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400"
          required
        />
      </div>
    </Card>
  );
}

