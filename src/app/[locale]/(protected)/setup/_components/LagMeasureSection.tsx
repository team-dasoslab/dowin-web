
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
    <div
      className="bg-white p-6 md:p-8 space-y-6 rounded-[24px]"
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
          className="h-11 w-full rounded-[12px] border-none bg-zinc-100 px-4 text-[15px] font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:bg-white focus:ring-4 focus:ring-primary/5"
          required
        />
      </div>
    </div>
  );
}

