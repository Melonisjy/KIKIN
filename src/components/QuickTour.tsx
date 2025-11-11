"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Users, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "teams",
    title: "나의 라인업",
    description: "가입한 팀들을 한눈에 확인하고 관리하세요",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "matches",
    title: "경기 브리핑",
    description: "예정된 경기와 출석 현황을 빠르게 확인하세요",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "attendance",
    title: "출석 투표",
    description: "경기 출석 여부를 투표로 빠르게 정리하세요",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

const STORAGE_KEY = "kickn.quickTour.completed";

export function QuickTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 이미 투어를 완료했는지 확인
    const hasCompletedTour = localStorage.getItem(STORAGE_KEY);
    if (hasCompletedTour === "true") {
      return;
    }

    // 로그인 상태 확인
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 로그인한 사용자만 투어 표시
        if (user) {
          // 약간의 딜레이 후 표시
          setTimeout(() => {
            setIsVisible(true);
          }, 1500);
        }
      } catch (error) {
        console.error("QuickTour 사용자 확인 오류:", error);
      }
    };

    checkUser();
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`relative w-full max-w-md rounded-xl border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-xl transition-all duration-300 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-[#71717A] hover:text-[#A1A1AA] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          {/* 진행 표시 */}
          <div className="flex items-center gap-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? "bg-[#00C16A]"
                    : "bg-[#2C354B]"
                }`}
              />
            ))}
          </div>

          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00C16A]/10 text-[#00C16A]">
              {step.icon}
            </div>
          </div>

          {/* 내용 */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-[#F4F4F5]">
              {step.title}
            </h3>
            <p className="text-sm text-[#A1A1AA]">{step.description}</p>
          </div>

          {/* 버튼 */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              건너뛰기
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {isLastStep ? "시작하기" : "다음"}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

