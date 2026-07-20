"use client";

import { type GithubPrLink } from "@/api/generated/dowin.schemas";
import { GithubPrBadge } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/GithubPrBadge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/Dialog";
import { GitPullRequest } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type DailyPrLinksPopoverProps = {
  prLinks: (GithubPrLink & { dailyLogDate?: string | null })[];
};

export function DailyPrLinksPopover({ prLinks }: DailyPrLinksPopoverProps) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  if (!prLinks || prLinks.length === 0) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="mx-auto flex w-fit items-center justify-center gap-1 rounded-[6px] bg-sub-background px-1.5 py-0.5 transition-colors hover:bg-border/60"
      >
        <GitPullRequest className="h-3 w-3 text-text-muted" />
        <span className="text-[10px] font-bold text-text-secondary">
          {prLinks.length}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-surface rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 w-[320px] animate-in zoom-in-95 fade-in duration-200"
          overlayClassName="bg-black/20"
        >
          <Button
            aria-label={t("close", { fallback: "닫기" })}
            variant="subtle"
            size="icon"
            className="absolute top-3 right-3 rounded-full bg-transparent hover:bg-sub-background"
            onClick={() => setOpen(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
          <div className="flex flex-col gap-4 mt-2" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[16px] font-bold text-text-primary text-center">
              {t("linkedPrs", { fallback: "연동된 PR 목록" })}
            </h4>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {prLinks.map((pr) => (
                <GithubPrBadge key={pr.id} pr={pr} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

