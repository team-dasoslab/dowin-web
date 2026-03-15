import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Compass, Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-pretendard">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,106,210,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.14),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
        <Card className="card-linear w-full max-w-xl rounded-[28px] border border-border/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 animate-linear-in">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-sub-background px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-text-muted uppercase">
                <SearchX className="h-3.5 w-3.5 text-primary" />
                404 Not Found
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Compass className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                WIG Tracker
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                찾으시는 페이지가 없어요
              </h1>
              <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 홈으로 돌아가거나
                내 점수판으로 이동해서 다시 시작하세요.
              </p>
            </div>

            <Button
              asChild
              className="btn-linear-primary flex items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                홈으로 가기
              </Link>
            </Button>

            <div className="rounded-2xl border border-dashed border-border bg-sub-background/80 px-4 py-3 text-xs leading-5 text-text-muted">
              입력한 URL을 다시 확인해 주세요. 보호된 경로라면 로그인 상태에
              따라 홈으로 이동할 수도 있습니다.
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
