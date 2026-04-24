import {
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  type MeasureInput,
  type SetupTag,
} from "@/app/[locale]/(protected)/setup/_lib/measure";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { WigIcon } from "@/components/ui/WigIcon";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface LeadMeasuresSectionProps {
  addMeasureRow: () => void;
  availableTags: SetupTag[];
  coachmarkTarget?: "lead-measure-tags" | null;
  createTag: (measureId: string, rawName: string) => Promise<boolean>;
  deleteTag: (tagId: number) => Promise<boolean>;
  handleMeasureChange: (
    id: string,
    field: keyof MeasureInput,
    value: string | number | "WEEKLY" | "MONTHLY" | null,
  ) => void;
  isMutating: boolean;
  isTagMutationPending: boolean;
  measures: MeasureInput[];
  monthlyTargetMax: number;
  renameTag: (tagId: number, rawName: string) => Promise<boolean>;
  removeMeasureRow: (id: string) => void;
  toggleMeasureTag: (measureId: string, tag: SetupTag) => void;
}

export function LeadMeasuresSection({
  addMeasureRow,
  availableTags,
  coachmarkTarget,
  createTag,
  deleteTag,
  handleMeasureChange,
  isMutating,
  isTagMutationPending,
  measures,
  monthlyTargetMax,
  renameTag,
  removeMeasureRow,
  toggleMeasureTag,
}: LeadMeasuresSectionProps) {
  const t = useTranslations("Setup");

  return (
    <Card
      data-coachmark="setup-lead"
    >
      <div className="divide-y divide-zinc-200/60">
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
            isTagCoachmarkTarget={
              coachmarkTarget === "lead-measure-tags" && index === 0
            }
            createTag={createTag}
            deleteTag={deleteTag}
            toggleMeasureTag={toggleMeasureTag}
            isTagMutationPending={isTagMutationPending}
            renameTag={renameTag}
          />
        ))}
      </div>

      <div className="border-t border-dashed border-zinc-200 bg-zinc-50/30 px-4 py-4 sm:px-8 sm:py-5">
        <Button
          type="button"
          disabled={isMutating}
          onClick={addMeasureRow}
          className="flex w-full items-center justify-center gap-2 py-3 rounded-content border border-zinc-200 bg-white text-sm font-bold text-zinc-500 transition-all hover:text-primary hover:border-primary/30"
        >
          <WigIcon name="action-add" size="16px" />
          {t("addLeadMeasure")}
        </Button>
      </div>
    </Card>
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
  isTagCoachmarkTarget,
  createTag,
  deleteTag,
  toggleMeasureTag,
  isTagMutationPending,
  renameTag,
}: {
  handleMeasureChange: LeadMeasuresSectionProps["handleMeasureChange"];
  index: number;
  isMutating: boolean;
  measure: MeasureInput;
  measuresCount: number;
  monthlyTargetMax: number;
  removeMeasureRow: (id: string) => void;
  availableTags: SetupTag[];
  isTagCoachmarkTarget: boolean;
  createTag: (measureId: string, rawName: string) => Promise<boolean>;
  deleteTag: (tagId: number) => Promise<boolean>;
  isTagMutationPending: boolean;
  renameTag: (tagId: number, rawName: string) => Promise<boolean>;
  toggleMeasureTag: (measureId: string, tag: SetupTag) => void;
}) {
  const [draftTagName, setDraftTagName] = useState("");
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [openActionTagId, setOpenActionTagId] = useState<number | null>(null);

  useEffect(() => {
    if (isTagCoachmarkTarget) {
      setIsTagEditorOpen(true);
    }
  }, [isTagCoachmarkTarget]);

  const t = useTranslations("Setup");

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-zinc-900">
            {t("leadMeasureShort")} #{index + 1}
          </label>
        </div>
        {measuresCount > 1 ? (
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => removeMeasureRow(measure.id)}
            className="px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded-content transition-colors"
          >
            {t("delete")}
          </Button>
        ) : null}
      </div>

      <Input
        value={measure.name}
        disabled={isMutating}
        onChange={(e) =>
          handleMeasureChange(measure.id, "name", e.target.value)
        }
        placeholder={t("leadMeasurePlaceholder")}
        className="w-full rounded-content border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-base focus:border-primary outline-none transition-all placeholder:text-zinc-300"
        required
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid w-full grid-cols-2 gap-1 rounded-content border border-zinc-200 bg-zinc-50/50 p-1 sm:w-auto sm:shrink-0 sm:flex">
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
              className={`rounded-button px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
                measure.period === period
                  ? "bg-white text-primary shadow-sm border border-zinc-200/50"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {period === "WEEKLY" ? t("modeWeekly") : t("modeMonthly")}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <div className="flex items-center rounded-content border border-zinc-200 bg-white overflow-hidden">
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
              className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-30 transition-colors"
              aria-label={t("decrement")}
            >
              <WigIcon name="action-subtract" size="16px" />
            </Button>
            <div className="flex h-11 min-w-14 items-center justify-center border-x border-zinc-200 px-3 text-base font-black text-zinc-900 font-mono">
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
              className="flex h-11 w-11 items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-30 transition-colors"
              aria-label={t("increment")}
            >
              <WigIcon name="action-add" size="16px" />
            </Button>
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-text-secondary">
            {measure.period === "WEEKLY"
              ? t("timesPerWeek")
              : t("timesPerMonth")}
          </span>
        </div>
      </div>

      <div
        className="rounded-content border border-zinc-200 bg-zinc-50/30 overflow-hidden"
        data-coachmark={isTagCoachmarkTarget ? "setup-lead-tags" : undefined}
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <WigIcon name="status-tag" size="14px" className="mt-1 shrink-0 text-primary/60" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                {t("tagLabel")}
              </p>
              {measure.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {measure.tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      disabled={isMutating}
                      onClick={() => toggleMeasureTag(measure.id, tag)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95"
                    >
                      #{tag.name}
                      <WigIcon name="action-dismiss" size="12px" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-zinc-400">
                  {t("noTags")}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            disabled={isMutating}
            onClick={() => setIsTagEditorOpen((previous) => !previous)}
            className={`w-full shrink-0 rounded-button border px-4 py-2 text-xs font-bold transition-all sm:w-auto ${
              isTagEditorOpen
                ? "bg-zinc-900 border-zinc-900 text-white"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
            }`}
          >
            {isTagEditorOpen ? t("done") : t("select")}
          </Button>
        </div>

        {isTagEditorOpen ? (
          <div className="space-y-3 border-t border-zinc-200 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-text-muted">
                {t("tagLimit", { n: MAX_MEASURE_TAGS })}
              </p>
              <span className="text-[11px] text-text-muted">
                {measure.tags.length}/{MAX_MEASURE_TAGS}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = measure.tags.some(
                  (item) => item.id === tag.id,
                );

                if (isSelected) {
                  return null;
                }

                return (
                  <div
                    key={tag.id}
                    className="relative flex items-center gap-1 rounded-full border border-zinc-200 bg-white pr-1"
                  >
                    {editingTagId === tag.id ? (
                      <>
                        <Input
                          value={editingTagName}
                          disabled={isMutating || isTagMutationPending}
                          maxLength={MAX_TAG_NAME_LENGTH}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void renameTag(tag.id, editingTagName).then(
                                (isRenamed) => {
                                  if (isRenamed) {
                                    setEditingTagId(null);
                                    setEditingTagName("");
                                  }
                                },
                              );
                            }

                            if (e.key === "Escape") {
                              setEditingTagId(null);
                              setEditingTagName("");
                              setOpenActionTagId(null);
                            }
                          }}
                          className="h-8 min-w-24 border-0 bg-transparent px-3 py-0 text-[11px] font-semibold text-text-primary outline-none"
                        />
                        <Button
                          type="button"
                          disabled={isMutating || isTagMutationPending}
                          onClick={() => {
                            void renameTag(tag.id, editingTagName).then(
                              (isRenamed) => {
                                if (isRenamed) {
                                  setEditingTagId(null);
                                  setEditingTagName("");
                                  setOpenActionTagId(null);
                                }
                              },
                            );
                          }}
                          className="rounded-full px-2 py-1 text-[10px] font-bold text-primary"
                        >
                          {t("save")}
                        </Button>
                        <Button
                          type="button"
                          disabled={isMutating || isTagMutationPending}
                          onClick={() => {
                            setEditingTagId(null);
                            setEditingTagName("");
                            setOpenActionTagId(null);
                          }}
                          className="rounded-full px-2 py-1 text-[10px] font-bold text-text-muted"
                        >
                          {t("cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          disabled={
                            isMutating ||
                            measure.tags.length >= MAX_MEASURE_TAGS
                          }
                          onClick={() => toggleMeasureTag(measure.id, tag)}
                          className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
                        >
                          #{tag.name}
                        </Button>
                        <Button
                          type="button"
                          disabled={isMutating || isTagMutationPending}
                          onClick={() => {
                            setOpenActionTagId((currentId) =>
                              currentId === tag.id ? null : tag.id,
                            );
                          }}
                          className="rounded-full p-1 text-text-muted hover:text-text-primary"
                          aria-label={t("edit")}
                        >
                          <WigIcon name="action-more" size="12px" />
                        </Button>
                        {openActionTagId === tag.id ? (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenActionTagId(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-2 min-w-28 rounded-content border border-zinc-200 bg-white p-1.5 shadow-lg">
                              <Button
                                type="button"
                                disabled={isMutating || isTagMutationPending}
                                onClick={() => {
                                  setEditingTagId(tag.id);
                                  setEditingTagName(tag.name);
                                  setOpenActionTagId(null);
                                }}
                                className="flex w-full items-center justify-start rounded-content px-3 py-2 text-[11px] font-semibold text-text-primary hover:bg-zinc-50/50"
                              >
                                {t("edit")}
                              </Button>
                              <Button
                                type="button"
                                disabled={isMutating || isTagMutationPending}
                                onClick={() => {
                                  const shouldDelete = window.confirm(
                                    t("deleteTagConfirmExtended"),
                                  );

                                  if (!shouldDelete) {
                                    setOpenActionTagId(null);
                                    return;
                                  }

                                  void deleteTag(tag.id).then(() => {
                                    setOpenActionTagId(null);
                                  });
                                }}
                                className="flex w-full items-center justify-start rounded-content px-3 py-2 text-[11px] font-semibold text-danger hover:bg-danger/5"
                              >
                                {t("delete")}
                              </Button>
                            </div>
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
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
                placeholder={t("newTagPlaceholder", { n: MAX_TAG_NAME_LENGTH })}
                className="w-full rounded-content border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-text-muted/40 focus:border-primary"
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
                className="rounded-content border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-zinc-50/50 sm:shrink-0"
              >
                {t("addTag")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
