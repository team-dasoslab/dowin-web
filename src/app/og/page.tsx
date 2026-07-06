"use client";

import { useExportImage } from "@/app/og/_hooks/useExportImage";
import { Logo } from "@/components/ui/Logo";
import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { CheckCircle2, Download, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

export default function OGImagePreviewPage() {
  if (publicRuntimeConfig.isDevelopment) {
    notFound();
  }

  const { exportRef, isExporting, handleDownload } = useExportImage();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-8">
      <div className="flex flex-col gap-4 max-w-[1200px] w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">OG Image Preview</h1>
            <p className="text-slate-500">크기: 1200 x 630 (OG 이미지 표준 규격)</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "저장 중..." : "이미지 다운로드"}
          </button>
        </div>

        {/* OG Image Container */}
        <div
          ref={exportRef}
          className="relative w-[1200px] h-[630px] overflow-hidden bg-white flex"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 0%, rgba(239, 240, 250, 1) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 20% 100%, rgba(239, 240, 250, 1) 0%, rgba(255, 255, 255, 0) 50%)",
          }}
        >
          {/* Background decorative elements */}
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 mix-blend-multiply" />

          {/* Left Content */}
          <div className="relative z-10 flex flex-col justify-center px-20 w-3/5 h-full">
            <div className="flex items-center gap-3 mb-8">
              <Logo size={48} className="text-slate-900" />
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">Dowin</span>
            </div>

            <h2 className="text-[64px] leading-[1.2] font-bold text-slate-900 tracking-[-0.02em] mb-6">
              가장 중요한 목표에 <br />
              <span className="text-primary">집중하세요</span>
            </h2>
          </div>

          {/* Right Content - Floating UI Mockup */}
          <div className="relative z-10 w-2/5 h-full flex items-center justify-center right-0">
            {/* Main Card */}
            <div className="absolute right-12 w-[420px] bg-white/90 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] border border-slate-100/50 transform rotate-[-2deg]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-500">이번 주 목표 달성률</div>
                    <div className="text-2xl font-bold text-slate-900">85%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { width: "w-[75%]", done: true },
                  { width: "w-[85%]", done: true },
                  { width: "w-[60%]", done: false },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <CheckCircle2
                      className={`w-6 h-6 shrink-0 ${
                        task.done ? "text-primary" : "text-slate-300"
                      }`}
                      strokeWidth={2}
                    />
                    <div
                      className={`h-4 rounded-full ${
                        task.done ? "bg-slate-300" : "bg-slate-200"
                      } ${task.width}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
