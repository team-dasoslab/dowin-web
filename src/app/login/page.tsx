"use client";

import { useMockData } from "@/context/MockDataContext";
import { LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const { login } = useMockData();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(id, pw);
    if (success) {
      router.push("/");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] card-linear p-10 space-y-10 animate-linear-in">
        <div className="space-y-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            WIG 로그인
          </h1>
          <p className="text-text-secondary text-sm">
            가장 중요한 목표에 집중할 준비가 되셨나요?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
              ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-2.5 input-linear text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 input-linear text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-xs font-medium text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full btn-linear-primary py-2.5 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>계속하기</span>
          </button>
        </form>

        <div className="pt-4 border-t border-border">
          <p className="text-[11px] text-text-muted leading-relaxed">
            * 부여받은 관리자 계정으로만 접속 가능하며, 첫 로그인 후에는
            비밀번호를 즉시 변경하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
