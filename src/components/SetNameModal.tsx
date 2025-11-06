"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SetNameModalProps {
  isOpen: boolean;
  currentName?: string | null;
  onClose?: () => void;
}

export function SetNameModal({
  isOpen,
  currentName,
  onClose,
}: SetNameModalProps) {
  const [name, setName] = useState(currentName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (name.trim().length > 100) {
      setError("이름은 100자 이하여야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 타임아웃 설정 (10초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/profile/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "이름 저장에 실패했습니다.");
      }

      // 성공
      setIsLoading(false);

      // onClose가 있으면 모달 닫기
      if (onClose) {
        onClose();
      }

      // 페이지 새로고침하여 변경사항 반영
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error: any) {
      console.error("Error:", error);
      if (error.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError(
          error?.message ||
            "이름 저장 중 오류가 발생했습니다. 다시 시도해주세요."
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={
        onClose ? (e) => e.target === e.currentTarget && onClose() : undefined
      }
    >
      <div className="w-full max-w-md rounded-xl border-2 border-[#00C16A]/20 bg-[#181A1F] p-8 shadow-xl mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#F4F4F5] mb-2">이름 설정</h2>
          <p className="text-[#A1A1AA]">
            풋살 경기에서 사용할 이름을 설정해주세요.
            <br />
            <span className="text-sm text-[#A1A1AA] opacity-80">
              이 이름은 경기 참여 시 표시됩니다.
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              이름 <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00C16A] focus:ring-offset-2"
              maxLength={100}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장하기"
              )}
            </Button>
          </div>

          <p className="text-xs text-[#A1A1AA] text-center">
            이름은 나중에 프로필에서 변경할 수 있습니다.
          </p>
        </form>
      </div>
    </div>
  );
}
