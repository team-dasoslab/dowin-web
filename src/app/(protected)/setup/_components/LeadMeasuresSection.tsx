import {
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  type MeasureInput,
  type SetupTag,
} from "@/app/(protected)/setup/_lib/measure";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Activity, Minus, Plus, Tag } from "lucide-react";
import { useState } from "react";

interface LeadMeasuresSectionProps {
  activeTooltip: "lag" | "lead" | null;
  addMeasureRow: () => void;
  availableTags: SetupTag[];
  createTag: (measureId: string, rawName: string) => Promise<boolean>;
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
  toggleMeasureTag: (measureId: string, tag: SetupTag) => void;
}

export function LeadMeasuresSection({
  activeTooltip,
  addMeasureRow,
  availableTags,
  createTag,
  handleMeasureChange,
  isMutating,
  measures,
  monthlyTargetMax,
  removeMeasureRow,
  setActiveTooltip,
  toggleMeasureTag,
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
            availableTags={availableTags}
            createTag={createTag}
            toggleMeasureTag={toggleMeasureTag}
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
  availableTags,
  createTag,
  toggleMeasureTag,
}: {
  handleMeasureChange: LeadMeasuresSectionProps["handleMeasureChange"];
  index: number;
  isMutating: boolean;
  measure: MeasureInput;
  measuresCount: number;
  monthlyTargetMax: number;
  removeMeasureRow: (id: string) => void;
  availableTags: SetupTag[];
  createTag: (measureId: string, rawName: string) => Promise<boolean>;
  toggleMeasureTag: (measureId: string, tag: SetupTag) => void;
}) {
  const [draftTagName, setDraftTagName] = useState("");
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);

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

      <div className="rounded-xl border border-border bg-sub-background/60">
        <div className="flex items-start justify-between gap-3 px-3 py-2.5">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[11px] font-bold text-text-secondary">태그</p>
              {measure.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {measure.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      className="inline-flex items-center rounded-full border border-primary/20 bg-primary px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-text-muted">
                  아직 태그가 없습니다.
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            disabled={isMutating}
            onClick={() => setIsTagEditorOpen((previous) => !previous)}
            className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-sub-background hover:text-text-primary"
          >
            {isTagEditorOpen ? "완료" : "선택"}
          </Button>
        </div>

        {isTagEditorOpen ? (
          <div className="space-y-3 border-t border-border px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-text-muted">
                분류용 태그를 최대 {MAX_MEASURE_TAGS}개까지 붙일 수 있어요.
              </p>
              <span className="text-[11px] text-text-muted">
                {measure.tags.length}/{MAX_MEASURE_TAGS}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = measure.tags.some((item) => item.id === tag.id);

                return (
                  <Button
                    key={tag.id}
                    type="button"
                    disabled={
                      isMutating ||
                      (!isSelected && measure.tags.length >= MAX_MEASURE_TAGS)
                    }
                    onClick={() => toggleMeasureTag(measure.id, tag)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-white text-text-secondary hover:border-primary/20 hover:text-text-primary"
                    }`}
                  >
                    #{tag.name}
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={draftTagName}
                disabled={isMutating}
                maxLength={MAX_TAG_NAME_LENGTH}
                onChange={(e) => setDraftTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") {
                    return;
                  }

                  e.preventDefault();
                  void createTag(measure.id, draftTagName).then((isCreated) => {
                    if (isCreated) {
                      setDraftTagName("");
                    }
                  });
                }}
                placeholder={`새 태그 추가 예: 아침루틴 (최대 ${MAX_TAG_NAME_LENGTH}자)`}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
              />
              <Button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  void createTag(measure.id, draftTagName).then((isCreated) => {
                    if (isCreated) {
                      setDraftTagName("");
                    }
                  });
                }}
                className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-sub-background sm:shrink-0"
              >
                태그 추가
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
