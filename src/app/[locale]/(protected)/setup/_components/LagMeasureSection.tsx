import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface LagMeasureSectionProps {
  activeTooltip: "lag" | "lead" | null;
  isMutating: boolean;
  lagMeasure: string;
  setActiveTooltip: (value: "lag" | "lead" | null) => void;
  setLagMeasure: (value: string) => void;
}

export function LagMeasureSection({
  activeTooltip,
  isMutating,
  lagMeasure,
  setActiveTooltip,
  setLagMeasure,
}: LagMeasureSectionProps) {
  const t = useTranslations("Setup");

  return (
    <Card
      className="rounded-lg border border-border"
      data-coachmark="setup-lag"
    >
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-sub-background px-5 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          <span className="text-xs font-bold text-text-primary">
            {t("lagMeasure")}
          </span>
        </div>
        <SetupTooltip
          active={activeTooltip === "lag"}
          buttonLabel={t("metricGuide")}
          title={t("goodLagTitle")}
          isMutating={isMutating}
          onToggle={() =>
            setActiveTooltip(activeTooltip === "lag" ? null : "lag")
          }
          onClose={() => setActiveTooltip(null)}
        >
          <li>
            <b className="text-text-primary">{t("lagTip1Label")}</b>
            {t("lagTip1Text")}
          </li>
          <li>
            <b className="text-text-primary">{t("lagTip2Label")}</b>
            {t("lagTip2Text")}
          </li>
        </SetupTooltip>
      </div>
      <div className="space-y-3 p-5">
        <label className="block text-xs font-bold text-text-secondary">
          {t("lagMeasureQuestion")}
        </label>
        <Input
          value={lagMeasure}
          disabled={isMutating}
          onChange={(e) => setLagMeasure(e.target.value)}
          placeholder={t("lagMeasurePlaceholder")}
          className="w-full rounded-lg border border-border bg-sub-background p-3 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
          required
        />
      </div>
    </Card>
  );
}

function SetupTooltip({
  active,
  buttonLabel,
  children,
  isMutating,
  onClose,
  onToggle,
  title,
}: {
  active: boolean;
  buttonLabel: string;
  children: React.ReactNode;
  isMutating: boolean;
  onClose: () => void;
  onToggle: () => void;
  title: string;
}) {
  return (
    <div className="relative">
      <Button
        type="button"
        disabled={isMutating}
        onClick={onToggle}
        className="flex items-center gap-0.5 text-[10px] font-medium text-text-muted transition-colors hover:text-primary"
      >
        {buttonLabel}
      </Button>
      {active ? (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-white p-4 shadow-lg transition-all">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">
              {title}
            </p>
            <ul className="space-y-2 text-[11px] leading-relaxed text-text-secondary">
              {children}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
