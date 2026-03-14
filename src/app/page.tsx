"use client";

import { useMockData } from "@/context/MockDataContext";
import { LogIn, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useMockData();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(id, pw);
    if (success) {
      // In a real app, 'isFirstLogin' would determine the next page
      // For now, let's assume if the user object has it, we use it
      const savedUser = JSON.parse(localStorage.getItem("wig_user") || "{}");
      if (savedUser.isFirstLogin) {
        router.push("/setup");
      } else {
        router.push("/dashboard/my"); // Changed to /dashboard/my to match onboarding guide and current structure
      }
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-pretendard">
      <div className="w-full max-w-[380px] bg-white border border-border rounded-2xl p-8 md:p-10 shadow-sm animate-linear-in">
        {/* ── 로고 및 타이틀 ── */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Zap className="text-primary w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              WIG
            </h1>
            <p className="text-[13px] text-text-muted">
              가장 중요한 목표에 집중하세요.
            </p>
          </div>
        </div>

        {/* ── 로그인 폼 ── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
                아이디
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
                비밀번호
              </label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-danger text-[11px] font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all
              ${
                isLoading
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-linear-primary shadow-lg shadow-primary/10"
              }
            `}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>시작하기</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
