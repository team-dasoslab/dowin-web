import type { MeasureInput } from "@/app/(protected)/setup/_lib/measure";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Activity, Minus, Plus } from "lucide-react";

interface LeadMeasuresSectionProps {
  activeTooltip: "lag" | "lead" | null;
  addMeasureRow: () => void;
  handleMeasureChange: (
    id: string,
    field: keyof MeasureInput,
    value: string | number | "WEEKLY" | "MONTHLY" | null,
  ) => void;
  isMutating: boolean;
  measures: MeasureInput[];
  monthlyTargetMax: number;
  removeMeasureRow: (id: string) => void;
  setActiveTooltip: (value: "lag" | "lead" | null) => void;
}

export function LeadMeasuresSection({
  activeTooltip,
  addMeasureRow,
  handleMeasureChange,
  isMutating,
  measures,
  monthlyTargetMax,
  removeMeasureRow,
  setActiveTooltip,
}: LeadMeasuresSectionProps) {
  return (
    <Card
      className="rounded-lg border border-border"
      data-coachmark="setup-lead"
    >
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-sub-background px-5 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-rose-500" />
          <span className="text-xs font-bold text-text-primary">선행지표</span>
          <span className="text-[10px] text-text-muted">
            — 후행지표에 직접적 영향을 주는 핵심 행동
          </span>
        </div>
        <LeadTooltip
          active={activeTooltip === "lead"}
          isMutating={isMutating}
          onClose={() => setActiveTooltip(null)}
          onToggle={() =>
            setActiveTooltip(activeTooltip === "lead" ? null : "lead")
          }
        />
      </div>

      <div className="divide-y divide-border">
        {measures.map((measure, index) => (
          <LeadMeasureRow
            key={measure.id}
            handleMeasureChange={handleMeasureChange}
            index={index}
            isMutating={isMutating}
            measure={measure}
            measuresCount={measures.length}
            monthlyTargetMax={monthlyTargetMax}
            removeMeasureRow={removeMeasureRow}
          />
        ))}
      </div>

      <div className="border-t border-dashed border-border px-5 py-3">
        <Button
          type="button"
          disabled={isMutating}
          onClick={addMeasureRow}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-bold text-text-muted transition-colors hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          핵심 행동 추가
        </Button>
      </div>
    </Card>
  );
}

function LeadTooltip({
  active,
  isMutating,
  onClose,
  onToggle,
}: {
  active: boolean;
  isMutating: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Button
        type="button"
        disabled={isMutating}
        onClick={onToggle}
        className="flex items-center gap-0.5 text-[10px] font-medium text-text-muted transition-colors hover:text-primary"
      >
        4DX 가이드 ›
      </Button>
      {active ? (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-white p-4 shadow-lg transition-all">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">
              좋은 선행지표
            </p>
            <ul className="space-y-2 text-[11px] leading-relaxed text-text-secondary">
              <li>
                <b className="text-text-primary">예측성:</b> 이 행동이
                후행지표를 움직이나요?
              </li>
              <li>
                <b className="text-text-primary">통제 가능:</b> 직접 실행하고
                반복할 수 있나요?
              </li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

function LeadMeasureRow({
  handleMeasureChange,
  index,
  isMutating,
  measure,
  measuresCount,
  monthlyTargetMax,
  removeMeasureRow,
}: {
  handleMeasureChange: LeadMeasuresSectionProps["handleMeasureChange"];
  index: number;
  isMutating: boolean;
  measure: MeasureInput;
  measuresCount: number;
  monthlyTargetMax: number;
  removeMeasureRow: (id: string) => void;
}) {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text-secondary">
          핵심 행동 #{index + 1}
        </label>
        {measuresCount > 1 ? (
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => removeMeasureRow(measure.id)}
            className="rounded px-2 py-0.5 text-[11px] font-bold text-danger transition-colors hover:bg-danger/5"
          >
            삭제
          </Button>
        ) : null}
      </div>

      <Input
        value={measure.name}
        disabled={isMutating}
        onChange={(e) =>
          handleMeasureChange(measure.id, "name", e.target.value)
        }
        placeholder="예: 주 4회, 30분 달리기"
        className="w-full rounded-lg border border-border bg-sub-background p-3 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
        required
      />

      <div className="flex items-center gap-3">
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-border bg-sub-background p-0.5">
          {(["WEEKLY", "MONTHLY"] as const).map((period) => (
            <Button
              key={period}
              type="button"
              disabled={isMutating}
              onClick={() => {
                handleMeasureChange(measure.id, "period", period);
                handleMeasureChange(
                  measure.id,
                  "targetValue",
                  period === "WEEKLY" ? 3 : 1,
                );
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                measure.period === period
                  ? "border border-border bg-white text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {period === "WEEKLY" ? "주 단위" : "월 단위"}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-white">
            <Button
              type="button"
              disabled={isMutating || measure.targetValue <= 1}
              onClick={() =>
                handleMeasureChange(
                  measure.id,
                  "targetValue",
                  measure.targetValue - 1,
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-l-lg text-text-secondary hover:bg-sub-background disabled:opacity-40"
              aria-label="횟수 감소"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex h-10 min-w-12 items-center justify-center border-x border-border px-2 text-sm font-bold text-text-primary">
              {measure.targetValue}
            </div>
            <Button
              type="button"
              disabled={
                isMutating ||
                measure.targetValue >=
                  (measure.period === "WEEKLY" ? 7 : monthlyTargetMax)
              }
              onClick={() =>
                handleMeasureChange(
                  measure.id,
                  "targetValue",
                  measure.targetValue + 1,
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-r-lg text-text-secondary hover:bg-sub-background disabled:opacity-40"
              aria-label="횟수 증가"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-text-secondary">
            회 / {measure.period === "WEEKLY" ? "주" : "월"}
          </span>
        </div>
      </div>
    </div>
  );
}
