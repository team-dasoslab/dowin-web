import {
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  type MeasureInput,
  type SetupTag,
} from "@/app/[locale]/(protected)/setup/_lib/measure";
import { Button } from "@/components/ui/Button";

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
  restoreMeasureRow: (id: string) => void;
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
  restoreMeasureRow,
  toggleMeasureTag,
}: LeadMeasuresSectionProps) {
  const t = useTranslations("Setup");
  const activeMeasures = measures.filter((measure) => measure.status === "ACTIVE");
  const archivedMeasures = measures.filter(
    (measure) => measure.status === "ARCHIVED",
  );
  const activeCount = measures.filter(
    (measure) => measure.status === "ACTIVE" && !measure.isDeleted,
  ).length;

  return (
    <div className="bg-white rounded-[24px] overflow-hidden" data-coachmark="setup-lead">
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
            measuresCount={activeCount}
            monthlyTargetMax={monthlyTargetMax}
            removeMeasureRow={removeMeasureRow}
            restoreMeasureRow={restoreMeasureRow}
            renameTag={renameTag}
            toggleMeasureTag={toggleMeasureTag}
          />
        ))}
      </div>

      <div className="bg-white px-4 py-6 sm:px-8">
        <Button
          type="button"
          disabled={isMutating}
          onClick={addMeasureRow}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#E8F3FF] py-4 text-[15px] font-bold text-primary transition-all active:scale-95"
        >
          <DowinIcon name="action-add" size="18px" />
          {t("addLeadMeasure")}
        </Button>
      </div>

      <ArchivedMeasuresSection
        archivedMeasures={archivedMeasures}
        isMutating={isMutating}
        reactivateMeasureRow={reactivateMeasureRow}
        removeMeasureRow={removeMeasureRow}
        restoreMeasureRow={restoreMeasureRow}
      />
    </div>
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
  restoreMeasureRow,
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
  restoreMeasureRow: (id: string) => void;
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

  if (measure.isDeleted) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8 bg-zinc-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full shrink-0">
            {t("deletedBadge")}
          </span>
          <span className="text-sm font-semibold text-zinc-400 truncate max-w-[200px] sm:max-w-[400px]">
            {measure.name || t("unnamedArchivedMeasure")}
          </span>
        </div>
        <Button
          type="button"
          disabled={isMutating}
          onClick={() => restoreMeasureRow(measure.id)}
          className="w-full sm:w-auto rounded-content border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-600 transition-all active:scale-95 shrink-0"
        >
          {t("cancelDelete")}
        </Button>
      </div>
    );
  }

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
                className="flex h-8 items-center gap-1.5 rounded-button bg-zinc-100 px-3 text-[12px] font-bold text-text-primary transition-colors disabled:opacity-40 hover:bg-zinc-200"
              >
                {t("archiveMeasure")}
              </Button>
              <Button
                type="button"
                disabled={isMutating}
                onClick={() => removeMeasureRow(measure.id)}
                className="flex h-8 items-center gap-1.5 rounded-button bg-red-50 px-3 text-[12px] font-bold text-red-500 transition-colors disabled:opacity-40 hover:bg-red-100"
              >
                {t("delete")}
              </Button>
            </>
          ) : measuresCount > 1 ? (
            <Button
              type="button"
              disabled={isMutating}
              onClick={() => removeMeasureRow(measure.id)}
              className="flex h-8 items-center gap-1.5 rounded-button bg-red-50 px-3 text-[12px] font-bold text-red-500 transition-colors disabled:opacity-40 hover:bg-red-100"
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
        className="h-11 w-full rounded-[12px] border-none bg-zinc-100 px-4 text-[15px] font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:bg-white focus:ring-4 focus:ring-primary/5"
        required
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex w-full rounded-content bg-zinc-100/80 p-1 sm:w-auto">
          {(["WEEKLY", "MONTHLY"] as const).map((period) => {
            const isActive = measure.period === period;
            return (
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
                className={`relative z-10 flex-1 rounded-[10px] py-2.5 text-[14px] font-bold transition-all duration-200 sm:px-6 ${
                  isActive
                    ? "bg-white text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {period === "WEEKLY" ? "매주" : "매달"}
              </Button>
            );
          })}
        </div>

        <div className="relative flex w-full rounded-content bg-zinc-100/80 p-1 sm:w-auto">
          {(["BOOLEAN", "COUNT"] as const).map((mode) => {
            const isActive = measure.trackingMode === mode;
            return (
              <Button
                key={mode}
                type="button"
                disabled={isMutating}
                onClick={() => handleMeasureChange(measure.id, "trackingMode", mode)}
                className={`relative z-10 flex-1 whitespace-nowrap rounded-[10px] py-2.5 text-[14px] font-bold transition-all duration-200 sm:px-6 ${
                  isActive
                    ? "bg-white text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {mode === "BOOLEAN" ? t("trackingModeBoolean") : t("trackingModeCount")}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-content bg-zinc-50/30 p-3 sm:flex-row sm:items-center sm:bg-transparent sm:p-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="whitespace-nowrap text-sm font-medium text-zinc-600">
            {measure.period === "WEEKLY" ? "매주" : "매달"}
          </span>
          <div className="flex shrink-0 items-center overflow-hidden rounded-[16px] bg-zinc-100">
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
              className="flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors disabled:opacity-30 active:bg-zinc-200/50"
              aria-label={t("decrement")}
            >
              <DowinIcon name="action-subtract" size="16px" />
            </Button>
            <div className="flex h-12 min-w-12 items-center justify-center px-2 font-mono text-[17px] font-black text-zinc-900">
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
              className="flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors disabled:opacity-30 active:bg-zinc-200/50"
              aria-label={t("increment")}
            >
              <DowinIcon name="action-add" size="16px" />
            </Button>
          </div>
          <span className="whitespace-nowrap text-[15px] font-semibold text-zinc-600">
            {measure.trackingMode === "COUNT" ? "일" : "회"}
          </span>
        </div>

        {measure.trackingMode === "COUNT" && (
          <>
            <span className="hidden text-zinc-300 sm:inline">·</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="whitespace-nowrap text-[15px] font-semibold text-zinc-600">
                하루에
              </span>
              <div className="flex shrink-0 items-center overflow-hidden rounded-[16px] bg-zinc-100">
                <Button
                  type="button"
                  disabled={isMutating || measure.dailyTargetCount <= 1}
                  onClick={() =>
                    handleMeasureChange(
                      measure.id,
                      "dailyTargetCount",
                      measure.dailyTargetCount - 1,
                    )
                  }
                  className="flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors disabled:opacity-30 active:bg-zinc-200/50"
                >
                  <DowinIcon name="action-subtract" size="16px" />
                </Button>
                <div className="flex h-12 min-w-12 items-center justify-center px-2 font-mono text-[17px] font-black text-zinc-900">
                  {measure.dailyTargetCount}
                </div>
                <Button
                  type="button"
                  disabled={isMutating || measure.dailyTargetCount >= 20}
                  onClick={() =>
                    handleMeasureChange(
                      measure.id,
                      "dailyTargetCount",
                      measure.dailyTargetCount + 1,
                    )
                  }
                  className="flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors disabled:opacity-30 active:bg-zinc-200/50"
                >
                  <DowinIcon name="action-add" size="16px" />
                </Button>
              </div>
              <span className="whitespace-nowrap text-[15px] font-semibold text-zinc-600">
                회
              </span>
            </div>
          </>
        )}
      </div>
      <div
        className="rounded-[16px] bg-zinc-100"
        data-coachmark={isTagCoachmarkTarget ? "setup-lead-tags" : undefined}
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <DowinIcon
              name="status-tag"
              size="16px"
              className="mt-0.5 shrink-0 text-primary"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[12px] font-bold text-zinc-500">
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-white transition-all active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                    >
                      #{tag.name}
                      <DowinIcon name="action-dismiss" size="12px" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] font-medium text-zinc-400">
                  {t("noTags")}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            disabled={isMutating}
            onClick={() => setIsTagEditorOpen((previous) => !previous)}
            className={`w-full shrink-0 rounded-[12px] px-4 py-2.5 text-[13px] font-bold transition-all sm:w-auto ${
              isTagEditorOpen
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 shadow-sm"
            }`}
          >
            {isTagEditorOpen ? t("done") : t("select")}
          </Button>
        </div>

        {isTagEditorOpen ? (
          <div className="space-y-4 border-t border-zinc-200/50 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-zinc-500">
                {t("tagLimit", { n: MAX_MEASURE_TAGS })}
              </p>
              <span className="text-[12px] font-bold text-zinc-500">
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
                    className="relative flex items-center gap-1 rounded-full bg-white px-1 py-0.5 shadow-sm"
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
                          className="h-8 min-w-0 border-none bg-transparent px-3 py-0 text-[13px] font-semibold text-zinc-700 focus-visible:ring-0"
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
                          className="rounded-full px-3 py-1 text-[12px] font-bold text-primary active:scale-95 transition-transform"
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
                          className="rounded-full px-3 py-1 text-[12px] font-bold text-zinc-400 active:scale-95 transition-transform"
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
                          className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:text-zinc-900 active:scale-95"
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
                            className="rounded-full p-2 text-zinc-400 transition-colors hover:text-zinc-600 active:bg-zinc-100"
                            aria-label={t("edit")}
                          >
                            <DowinIcon name="action-more" size="14px" />
                          </Button>
                          {openActionTagId === tag.id ? (
                            <div className="absolute right-0 top-10 z-10 min-w-[120px] overflow-hidden rounded-[12px] border-none bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
                              <Button
                                type="button"
                                disabled={isMutating || isTagMutationPending}
                                onClick={() => {
                                  setEditingTagId(tag.id);
                                  setEditingTagName(tag.name);
                                  setOpenActionTagId(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                              >
                                <DowinIcon name="action-edit" size="14px" />
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
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50"
                              >
                                <DowinIcon name="action-delete" size="14px" />
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
                className="h-11 flex-1 rounded-[12px] border-none bg-white px-4 text-[14px] font-medium shadow-sm transition-colors placeholder:text-zinc-500 focus:ring-4 focus:ring-primary/5"
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
                className="rounded-[12px] bg-primary px-5 py-3 text-[14px] font-bold text-white transition-transform active:scale-95 sm:h-[48px]"
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
  restoreMeasureRow: (id: string) => void;
}

function ArchivedMeasuresSection({
  archivedMeasures,
  isMutating,
  reactivateMeasureRow,
  removeMeasureRow,
  restoreMeasureRow,
}: ArchivedMeasuresSectionProps) {
  const t = useTranslations("Setup");

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-[16px] font-bold text-zinc-900">
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
        <div className="mt-5 rounded-[24px] bg-zinc-50/80 px-4 py-8 text-center text-[14px] font-medium text-zinc-500">
          {t("noArchivedMeasures")}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[24px] bg-zinc-50/80">
          {archivedMeasures.map((measure) => {
            if (measure.isDeleted) {
              return (
                <div
                  key={measure.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full shrink-0">
                      {t("deletedBadge")}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400 truncate max-w-[200px] sm:max-w-[400px]">
                      {measure.name || t("unnamedArchivedMeasure")}
                    </span>
                  </div>
                  <Button
                    type="button"
                    disabled={isMutating}
                    onClick={() => restoreMeasureRow(measure.id)}
                    className="flex h-10 items-center gap-1.5 rounded-[12px] bg-zinc-100 px-4 text-[13px] font-bold text-zinc-600 transition-all active:scale-95 disabled:opacity-55"
                  >
                    <span>{t("cancelDelete")}</span>
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={measure.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-colors"
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
                    className="flex h-10 items-center gap-1.5 rounded-[12px] bg-zinc-100 px-4 text-[13px] font-bold text-zinc-600 transition-all active:scale-95 disabled:opacity-55"
                  >
                    <DowinIcon name="action-undo" size="14px" />
                    <span>{t("reactivateMeasure")}</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={isMutating}
                    onClick={() => removeMeasureRow(measure.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-red-50 text-red-500 transition-all active:scale-95 disabled:opacity-55 sm:w-auto sm:px-4 sm:bg-transparent"
                  >
                    <DowinIcon name="action-delete" size="14px" className="sm:mr-1.5" />
                    <span className="hidden sm:inline font-bold text-[13px]">{t("delete")}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
