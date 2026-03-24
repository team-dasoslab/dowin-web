import { Button } from "@/components/ui/Button";
import { LogIn, Plus } from "lucide-react";
import Link from "next/link";

export function NoWorkspaceActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        className="btn-linear-primary flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold"
      >
        <Link href="/workspace/new">
          <Plus className="w-4 h-4" />새 워크스페이스 만들기
        </Link>
      </Button>

      <Button
        asChild
        className="flex items-center gap-2 rounded-lg bg-white border border-border px-5 py-3 text-sm font-bold text-text-primary hover:border-[rgba(205,207,213,1)]"
      >
        <Link href="/workspace/join">
          <LogIn className="w-4 h-4" />초대코드로 참가하기
        </Link>
      </Button>
    </div>
  );
}
