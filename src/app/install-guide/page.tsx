import { CopyServiceLinkButton } from "@/app/install-guide/_components/CopyServiceLinkButton";
import { GuideImage } from "@/app/install-guide/_components/GuideImage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  ChevronRight,
  Ellipsis,
  House,
  PlusSquare,
  Share,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    step: "STEP 1",
    title: "Safari에서 WIG 링크 열기",
    description:
      "iPhone에서는 Safari에서만 WIG를 홈 화면에 설치할 수 있어요. 다른 브라우저에서 열었다면 Safari로 다시 열어 진행해주세요.",
    icon: Smartphone,
  },
  {
    step: "STEP 2",
    title: "하단 점 세 개 버튼 누르기",
    description:
      "화면 아래 메뉴에서 점 세 개 버튼을 눌러 추가 메뉴를 열어주세요.",
    icon: Ellipsis,
    imageSrc: "/assets/guide/guide01.png",
    imageAlt: "Safari 하단 더보기 버튼 예시",
  },
  {
    step: "STEP 3",
    title: "공유 버튼 누르기",
    description:
      "펼쳐진 메뉴에서 공유 버튼을 눌러 설치 관련 옵션이 있는 공유 시트를 띄웁니다.",
    icon: Share,
  },
  {
    step: "STEP 4",
    title: "더보기 클릭",
    description:
      "공유 시트 옵션이 짧게 보이면 더보기를 눌러 전체 액션 목록을 확인합니다.",
    icon: ChevronRight,
    imageSrc: "/assets/guide/guide02.png",
    imageAlt: "Safari 공유 시트 더보기 예시",
  },
  {
    step: "STEP 5",
    title: "홈 화면에 추가 선택",
    description:
      "액션 목록에서 홈 화면에 추가를 누르면 앱 아이콘 이름을 확인할 수 있습니다.",
    icon: PlusSquare,
    imageSrc: "/assets/guide/guide03.png",
    imageAlt: "홈 화면에 추가 메뉴 예시",
  },
  {
    step: "STEP 6",
    title: "설치 완료",
    description:
      "홈 화면에 WIG 아이콘이 생기면 완료입니다. 이후에는 앱처럼 바로 열 수 있습니다.",
    icon: House,
    imageSrc: "/assets/guide/guide04.png",
    imageAlt: "홈 화면에 설치된 WIG 예시",
  },
] as const;

export default function InstallGuidePage() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex max-w-[560px] flex-col gap-6 p-4 pb-10 animate-linear-in md:p-8">
        <header className="flex items-center justify-between">
          <Button
            asChild
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <p className="text-xs text-text-muted">iPhone 설치 가이드</p>
          <div className="w-8" />
        </header>

        <Card className="overflow-hidden rounded-[1.5rem] border border-border bg-white">
          <div className="bg-[linear-gradient(135deg,rgba(94,106,210,0.12),rgba(132,204,22,0.08))] px-5 py-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              iPhone + Safari 기준
            </div>
            <div className="space-y-2">
              <h1 className="text-[24px] font-bold leading-tight tracking-tight text-text-primary">
                홈 화면에 추가해서
                <br />
                WIG를 앱처럼 써보세요
              </h1>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.step} className="relative pl-14">
                {!isLast ? (
                  <div className="absolute left-[1.55rem] top-12 h-[calc(100%-1.5rem)] w-px bg-border" />
                ) : null}

                <div className="absolute left-0 top-0 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <Card className="rounded-[1.25rem] border border-border bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)]">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                        {step.step}
                      </p>
                      <h2 className="text-base font-bold tracking-tight text-text-primary">
                        {step.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {step.description}
                      </p>
                    </div>

                    {index === 0 ? <CopyServiceLinkButton /> : null}

                    {"imageSrc" in step ? <GuideImage alt={step.imageAlt} src={step.imageSrc} /> : null}
                  </div>
                </Card>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
