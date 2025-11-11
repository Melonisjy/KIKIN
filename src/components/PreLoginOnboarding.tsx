"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinTeamModal } from "./JoinTeamModal";

export function PreLoginOnboarding() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // 기본값을 true로 설정

  useEffect(() => {
    // localStorage에서 닫힘 상태 확인
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("kickn.preLoginOnboarding.dismissed");
      setIsDismissed(dismissed === "true");
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("kickn.preLoginOnboarding.dismissed", "true");
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="relative rounded-xl border border-[#00C16A]/30 bg-gradient-to-br from-[#00C16A]/10 to-[#00C16A]/5 p-6 backdrop-blur-sm">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-[#71717A] hover:text-[#A1A1AA] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#F4F4F5] mb-1">
              킥-인 라커룸에 오신 것을 환영합니다!
            </h3>
            <p className="text-sm text-[#A1A1AA]">
              어떻게 시작하시겠어요?
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="group flex items-center gap-3 rounded-lg border border-[#2C354B] bg-[#141824] p-4 text-left transition-all duration-200 hover:border-[#00C16A]/50 hover:bg-[#1A2333]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00C16A]/10 text-[#00C16A]">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#F4F4F5] mb-0.5">
                  팀 코드가 있으신가요?
                </h4>
                <p className="text-xs text-[#A1A1AA]">
                  팀 코드로 빠르게 합류하세요
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#71717A] group-hover:text-[#00C16A] group-hover:translate-x-1 transition-all" />
            </button>

            <Link
              href="/team/new"
              className="group flex items-center gap-3 rounded-lg border border-[#2C354B] bg-[#141824] p-4 text-left transition-all duration-200 hover:border-[#00C16A]/50 hover:bg-[#1A2333]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#F4F4F5] mb-0.5">
                  새 팀을 만드시나요?
                </h4>
                <p className="text-xs text-[#A1A1AA]">
                  첫 라인업을 꾸려보세요
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#71717A] group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      <JoinTeamModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </>
  );
}

