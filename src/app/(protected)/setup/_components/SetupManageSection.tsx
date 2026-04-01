import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Archive } from "lucide-react";

interface SetupManageSectionProps {
  archive: () => Promise<boolean>;
  isArchivePending: boolean;
  isMutating: boolean;
}

export function SetupManageSection({
  archive,
  isArchivePending,
  isMutating,
}: SetupManageSectionProps) {
  return (
    <div className="space-y-2 pt-4">
      <p className="px-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        관리
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between bg-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">점수판 보관</p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              현재 목표를 종료하고 실행 기록으로 저장합니다.
            </p>
          </div>
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => {
              if (confirm("이 점수판을 보관하시겠습니까?")) {
                void archive();
              }
            }}
            className="ml-4 flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-[rgba(205,207,213,1)]"
          >
            {isArchivePending ? (
              <InlineSpinner
                size="sm"
                className="border-text-secondary/20 border-t-text-secondary"
              />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {isArchivePending ? "보관 중..." : "보관"}
          </Button>
        </div>
      </div>
    </div>
  );
}
