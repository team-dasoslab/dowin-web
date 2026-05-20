import {
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  type MeasureInput,
  type SetupTag,
} from "@/app/[locale]/(protected)/setup/_lib/measure";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface LeadMeasuresSectionProps {
  addMeasureRow: () => void;
  archiveMeasureRow: (id: string) => void;
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
  reactivateMeasureRow: (id: string) => void;
  renameTag: (tagId: number, rawName: string) => Promise<boolean>;
  removeMeasureRow: (id: string) => void;
  toggleMeasureTag: (measureId: string, tag: SetupTag) => void;
}

export function LeadMeasuresSection({
  addMeasureRow,
  archiveMeasureRow,
  availableTags,
  coachmarkTarget,
  createTag,
  deleteTag,
  handleMeasureChange,
  isMutating,
  isTagMutationPending,
  measures,
  monthlyTargetMax,
  reactivateMeasureRow,
  renameTag,
  removeMeasureRow,
  toggleMeasureTag,
}: LeadMeasuresSectionProps) {
  const t = useTranslations("Setup");
  const activeMeasures = measures.filter((measure) => measure.status === "ACTIVE");
  const archivedMeasures = measures.filter(
    (measure) => measure.status === "ARCHIVED",
  );

  return (
    <Card data-coachmark="setup-lead">
      <div className="divide-y divide-zinc-200/60">
        {activeMeasures.map((measure, index) => (
          <LeadMeasureRow
            key={measure.id}
            archiveMeasureRow={archiveMeasureRow}
            availableTags={availableTags}
            createTag={createTag}
            deleteTag={deleteTag}
            handleMeasureChange={handleMeasureChange}
            index={index}
            isMutating={isMutating}
            isTagCoachmarkTarget={
              coachmarkTarget === "lead-measure-tags" && index === 0
            }
            isTagMutationPending={isTagMutationPending}
            measure={measure}
            measuresCount={activeMeasures.length}
            monthlyTargetMax={monthlyTargetMax}
            removeMeasureRow={removeMeasureRow}
            renameTag={renameTag}
            toggleMeasureTag={toggleMeasureTag}
          />
        ))}
      </div>

      <div className="border-t border-dashed border-zinc-200 bg-zinc-50/30 px-4 py-4 sm:px-8 sm:py-5">
        <Button
          type="button"
          disabled={isMutating}
          onClick={addMeasureRow}
          className="flex w-full items-center justify-center gap-2 rounded-content border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-500 transition-all hover:border-primary/30 hover:text-primary"
        >
          <DowinIcon name="action-add" size="16px" />
          {t("addLeadMeasure")}
        </Button>
      </div>

      <ArchivedMeasuresSection
        archivedMeasures={archivedMeasures}
        isMutating={isMutating}
        reactivateMeasureRow={reactivateMeasureRow}
        removeMeasureRow={removeMeasureRow}
      />
    </Card>
  );
}

function LeadMeasureRow({
  archiveMeasureRow,
  availableTags,
  createTag,
  deleteTag,
  handleMeasureChange,
  index,
  isMutating,
  isTagCoachmarkTarget,
  isTagMutationPending,
  measure,
  measuresCount,
  monthlyTargetMax,
  removeMeasureRow,
  renameTag,
  toggleMeasureTag,
}: {
  archiveMeasureRow: (id: string) => void;
  availableTags: SetupTag[];
  createTag: (measureId: string, rawName: string) => Promise<boolean>;
  deleteTag: (tagId: number) => Promise<boolean>;
  handleMeasureChange: LeadMeasuresSectionProps["handleMeasureChange"];
  index: number;
  isMutating: boolean;
  isTagCoachmarkTarget: boolean;
  isTagMutationPending: boolean;
  measure: MeasureInput;
  measuresCount: number;
  monthlyTargetMax: number;
  removeMeasureRow: (id: string) => void;
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
  const canArchive = measure.existingId !== null;

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-zinc-900">
            {t("leadMeasureShort")} #{index + 1}
          </label>
        </div>
        <div className="flex items-center gap-2">
          {canArchive ? (
            <>
              <Button
                type="button"
                disabled={isMutating || measuresCount <= 1}
                onClick={() => archiveMeasureRow(measure.id)}
                className="rounded-content px-3 py-1 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
              >
                {t("archiveMeasure")}
              </Button>
              <Button
                type="button"
                disabled={isMutating}
                onClick={() => removeMeasureRow(measure.id)}
                className="rounded-content px-3 py-1 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
              >
                {t("delete")}
              </Button>
            </>
          ) : measuresCount > 1 ? (
            <Button
              type="button"
              disabled={isMutating}
              onClick={() => removeMeasureRow(measure.id)}
              className="rounded-content px-3 py-1 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
            >
              {t("delete")}
            </Button>
          ) : null}
        </div>
      </div>

      <Input
        value={measure.name}
        disabled={isMutating}
        onChange={(e) =>
          handleMeasureChange(measure.id, "name", e.target.value)
        }
        placeholder={t("leadMeasurePlaceholder")}
        className="w-full rounded-content border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-base outline-none transition-all placeholder:text-zinc-300 focus:border-primary"
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
                  ? "border border-zinc-200/50 bg-white text-primary shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {period === "WEEKLY" ? t("modeWeekly") : t("modeMonthly")}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <div className="flex items-center overflow-hidden rounded-content border border-zinc-200 bg-white">
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
              className="flex h-11 w-11 items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-30"
              aria-label={t("decrement")}
            >
              <DowinIcon name="action-subtract" size="16px" />
            </Button>
            <div className="flex h-11 min-w-14 items-center justify-center border-x border-zinc-200 px-3 font-mono text-base font-black text-zinc-900">
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
              className="flex h-11 w-11 items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-30"
              aria-label={t("increment")}
            >
              <DowinIcon name="action-add" size="16px" />
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
        className="rounded-content border border-zinc-200 bg-zinc-50/30"
        data-coachmark={isTagCoachmarkTarget ? "setup-lead-tags" : undefined}
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <DowinIcon
              name="status-tag"
              size="14px"
              className="mt-1 shrink-0 text-primary/60"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
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
                      <DowinIcon name="action-dismiss" size="12px" />
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
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
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
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
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
                            }
                          }}
                          className="h-8 min-w-0 border-0 bg-transparent px-3 py-0 text-xs font-semibold text-zinc-700 focus-visible:ring-0"
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
                                }
                              },
                            );
                          }}
                          className="rounded-full px-2 py-1 text-[11px] font-bold text-primary"
                        >
                          {t("save")}
                        </Button>
                        <Button
                          type="button"
                          disabled={isMutating || isTagMutationPending}
                          onClick={() => {
                            setEditingTagId(null);
                            setEditingTagName("");
                          }}
                          className="rounded-full px-2 py-1 text-[11px] font-bold text-zinc-400"
                        >
                          {t("cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          disabled={isMutating}
                          onClick={() => toggleMeasureTag(measure.id, tag)}
                          className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:text-primary"
                        >
                          #{tag.name}
                        </Button>
                        <div className="relative">
                          <Button
                            type="button"
                            disabled={isMutating || isTagMutationPending}
                            onClick={() =>
                              setOpenActionTagId((previous) =>
                                previous === tag.id ? null : tag.id,
                              )
                            }
                            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                            aria-label={t("edit")}
                          >
                            <DowinIcon name="action-more" size="14px" />
                          </Button>
                          {openActionTagId === tag.id ? (
                            <div className="absolute right-0 top-8 z-10 min-w-[120px] overflow-hidden rounded-content border border-zinc-200 bg-white shadow-lg">
                              <Button
                                type="button"
                                disabled={isMutating || isTagMutationPending}
                                onClick={() => {
                                  setEditingTagId(tag.id);
                                  setEditingTagName(tag.name);
                                  setOpenActionTagId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
                              >
                                <DowinIcon name="action-edit" size="12px" />
                                {t("edit")}
                              </Button>
                              <Button
                                type="button"
                                disabled={isMutating || isTagMutationPending}
                                onClick={() => {
                                  if (confirm(t("deleteTagConfirmExtended"))) {
                                    void deleteTag(tag.id);
                                  }
                                  setOpenActionTagId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                              >
                                <DowinIcon name="action-delete" size="12px" />
                                {t("delete")}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={draftTagName}
                disabled={isMutating || isTagMutationPending}
                maxLength={MAX_TAG_NAME_LENGTH}
                onChange={(e) => setDraftTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void createTag(measure.id, draftTagName).then((isCreated) => {
                      if (isCreated) {
                        setDraftTagName("");
                      }
                    });
                  }
                }}
                placeholder={t("newTagPlaceholder", { n: MAX_TAG_NAME_LENGTH })}
                className="h-10 flex-1 rounded-content border border-zinc-200 bg-white px-4 text-sm"
              />
              <Button
                type="button"
                disabled={isMutating || isTagMutationPending}
                onClick={() => {
                  void createTag(measure.id, draftTagName).then((isCreated) => {
                    if (isCreated) {
                      setDraftTagName("");
                    }
                  });
                }}
                className="rounded-button bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
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

interface ArchivedMeasuresSectionProps {
  archivedMeasures: MeasureInput[];
  isMutating: boolean;
  reactivateMeasureRow: (id: string) => void;
  removeMeasureRow: (id: string) => void;
}

function ArchivedMeasuresSection({
  archivedMeasures,
  isMutating,
  reactivateMeasureRow,
  removeMeasureRow,
}: ArchivedMeasuresSectionProps) {
  const t = useTranslations("Setup");

  return (
    <div className="border-t border-zinc-200/60 bg-zinc-50/20 px-4 py-5 sm:px-8 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900">
            {t("archivedMeasuresTitle")}
          </h3>
          <p className="text-xs text-text-secondary">
            {t("archivedMeasuresDesc")}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-500">
          {archivedMeasures.length}
        </span>
      </div>

      {archivedMeasures.length === 0 ? (
        <div className="mt-4 rounded-content border border-dashed border-zinc-200 bg-white/70 px-4 py-5 text-sm text-zinc-400">
          {t("noArchivedMeasures")}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white divide-y divide-zinc-100">
          {archivedMeasures.map((measure) => (
            <div
              key={measure.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-colors hover:bg-zinc-50/30"
            >
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-zinc-600">
                    {measure.name || t("unnamedArchivedMeasure")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-medium">
                  <span className="bg-zinc-50 px-1.5 py-0.5 rounded text-[11px]">
                    {measure.period === "WEEKLY"
                      ? t("modeWeekly")
                      : t("modeMonthly")}
                  </span>
                  <span>·</span>
                  <span>
                    {measure.targetValue}
                    {measure.period === "WEEKLY"
                      ? t("timesPerWeek")
                      : t("timesPerMonth")}
                  </span>
                  {measure.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex flex-wrap gap-1">
                        {measure.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-zinc-50 border border-zinc-200/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-400"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => reactivateMeasureRow(measure.id)}
                  className="flex h-8 items-center gap-1 rounded-button border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:text-primary active:scale-95 disabled:opacity-55"
                >
                  <DowinIcon name="action-undo" size="12px" />
                  <span>{t("reactivateMeasure")}</span>
                </Button>
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => removeMeasureRow(measure.id)}
                  className="flex h-8 items-center gap-1 rounded-button border border-transparent bg-transparent px-3 text-xs font-bold text-red-500 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-55"
                >
                  <DowinIcon name="action-delete" size="12px" className="text-red-400" />
                  <span>{t("delete")}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
