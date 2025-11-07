"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const isDevelopment = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/locker-room");
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Error signing in:", error);
        alert("로그인 중 오류가 발생했습니다: " + error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              name: name || email.split("@")[0],
            },
          },
        });

        if (error) {
          alert("회원가입 중 오류가 발생했습니다: " + error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // 회원가입 후 자동으로 로그인 시도
          // 이메일 확인이 필요한 경우를 대비해 세션 확인
          if (data.session) {
            // 세션이 있으면 바로 로그인 성공
            router.push("/locker-room");
          } else {
            // 세션이 없으면 (이메일 확인 필요) 수동 로그인 안내
            alert("회원가입이 완료되었습니다! 로그인해주세요.");
            setIsSignUp(false);
            setIsLoading(false);
          }
        }
      } else {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert("로그인 중 오류가 발생했습니다: " + error.message);
          setIsLoading(false);
          return;
        }

        router.push("/locker-room");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("예상치 못한 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#27272A] bg-[#181A1F] p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00C16A]">
            킥-인
          </h1>
          <p className="mt-2 text-[#A1A1AA]">
            풋살 팀 경기 일정 관리 플랫폼
          </p>
        </div>

        <div className="space-y-4">
          {!isEmailMode ? (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#27272A] bg-transparent px-4 py-3 font-medium text-[#F4F4F5] transition-all duration-200 hover:bg-[#181A1F] hover:border-[#27272A] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>로그인 중...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Google로 로그인</span>
                  </>
                )}
              </button>

              {isDevelopment && (
                <button
                  onClick={() => setIsEmailMode(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#27272A] bg-transparent px-4 py-3 font-medium text-[#A1A1AA] transition-all duration-200 hover:bg-[#181A1F] hover:border-[#27272A] active:scale-[0.98] cursor-pointer text-sm"
                >
                  <span>이메일로 로그인 (개발용)</span>
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 (선택사항)"
                    className="w-full rounded-lg border border-[#27272A] bg-[#0F0F11] px-4 py-2 text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#00C16A] focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                  className="w-full rounded-lg border border-[#27272A] bg-[#0F0F11] px-4 py-2 text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#00C16A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-[#27272A] bg-[#0F0F11] px-4 py-2 text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#00C16A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#00C16A] px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-[#00A85A] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </>
                ) : (
                  <span>{isSignUp ? "회원가입" : "로그인"}</span>
                )}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#00C16A] hover:underline"
                >
                  {isSignUp ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailMode(false);
                    setEmail("");
                    setPassword("");
                    setName("");
                    setIsSignUp(false);
                  }}
                  className="text-[#A1A1AA] hover:underline"
                >
                  Google 로그인으로
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-[#A1A1AA]">
            로그인하면 킥-인의{" "}
            <a href="#" className="underline">
              이용약관
            </a>
            과{" "}
            <a href="#" className="underline">
              개인정보 처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
