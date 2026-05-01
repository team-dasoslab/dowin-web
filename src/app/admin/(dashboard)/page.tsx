import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
          어드민 콘솔
        </h1>
        <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
          유저 문의 관리, 결제 상태 및 플랜 제한 관리, 워크스페이스에 대한 수동 보정을 처리할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-border rounded-content flex flex-col justify-between h-[180px] transition-all">
          <div>
            <h2 className="text-[16px] font-black tracking-tight text-text-primary mb-1">
              문의 처리 센터
            </h2>
            <p className="text-[13px] text-text-secondary leading-normal break-keep">
              인입된 고객 문의들을 확인하고, 상태를 업데이트하거나 처리결과 요약을 등록할 수 있습니다.
            </p>
          </div>
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center justify-center h-11 px-4 text-[13px] font-black bg-text-primary text-white rounded-button transition-all w-fit"
          >
            문의 목록 보기
          </Link>
        </Card>

        <Card className="p-6 bg-white border border-border rounded-content flex flex-col justify-between h-[180px] transition-all">
          <div>
            <h2 className="text-[16px] font-black tracking-tight text-text-primary mb-1">
              결제 지원 센터
            </h2>
            <p className="text-[13px] text-text-secondary leading-normal break-keep">
              워크스페이스 목록을 조회하고, 결제 및 플랜 상태의 변경 내용을 직접 수동 보정할 수 있습니다.
            </p>
          </div>
          <Link
            href="/admin/billing"
            className="inline-flex items-center justify-center h-11 px-4 text-[13px] font-black bg-text-primary text-white rounded-button transition-all w-fit"
          >
            워크스페이스 목록 보기
          </Link>
        </Card>
      </div>
    </div>
  );
}
