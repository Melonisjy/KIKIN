"use client";

import Link from "next/link";
import { Users, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockerRoomActions } from "@/app/locker-room/locker-room-actions";

interface EmptyStateGuideProps {
  onDismiss?: () => void;
}

export function EmptyStateGuide({ onDismiss }: EmptyStateGuideProps) {
  return (
    <div className="relative rounded-xl border-2 border-dashed border-[#00C16A]/30 bg-gradient-to-br from-[#00C16A]/5 to-transparent p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00C16A]/10">
          <Sparkles className="h-8 w-8 text-[#00C16A]" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-[#F4F4F5] mb-2">
        첫 라인업을 꾸려볼까요?
      </h3>
      <p className="text-sm text-[#A1A1AA] mb-6 max-w-md mx-auto">
        팀을 만들거나 팀 코드로 합류하여 경기 일정과 출석을 한 곳에서 관리하세요.
      </p>

      <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
        <LockerRoomActions />
        <Link href="/team/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            첫 팀 킥오프
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 빠른 가이드 */}
      <div className="mt-8 pt-6 border-t border-[#2C354B]">
        <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-4">
          빠른 시작 가이드
        </p>
        <div className="grid gap-3 sm:grid-cols-3 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00C16A]/10 text-[#00C16A]">
              <span className="text-xs font-bold">1</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F4F4F5] mb-0.5">
                팀 만들기
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                새 팀을 생성하고 팀 코드를 받으세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <span className="text-xs font-bold">2</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F4F4F5] mb-0.5">
                팀원 초대
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                팀 코드를 공유해 팀원들을 초대하세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/10 text-[#F97316]">
              <span className="text-xs font-bold">3</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F4F4F5] mb-0.5">
                경기 만들기
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                첫 경기를 만들고 출석을 모아보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

