"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ChevronRight, Info, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}

interface OnboardingGuideProps {
  storageKey: string;
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
  accentLabel?: string;
}

interface StoredState {
  dismissed: boolean;
  completedSteps: string[];
}

const STORAGE_PREFIX = "kickn.onboarding.";

export function OnboardingGuide({
  storageKey,
  title,
  subtitle,
  steps,
  accentLabel,
}: OnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const storageId = useMemo(() => `${STORAGE_PREFIX}${storageKey}`, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageId);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        setDismissed(parsed.dismissed);
        setCompletedSteps(parsed.completedSteps || []);
        // localStorage에 값이 있으면 무조건 닫힘 상태로 시작
        setIsOpen(false);
      } else {
        // 기본값: 닫힘 상태
        setIsOpen(false);
        setDismissed(false);
      }
    } catch {
      setIsOpen(false);
      setDismissed(false);
    }
  }, [storageId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const state: StoredState = {
      dismissed,
      completedSteps,
    };

    try {
      window.localStorage.setItem(storageId, JSON.stringify(state));
    } catch {
      // Ignore storage errors (private mode, quota exceeded, etc.)
    }
  }, [completedSteps, dismissed, storageId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleStep = (stepId: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setDismissed(true);
  };

  const handleReopen = () => {
    setDismissed(false);
    setIsOpen(true);
  };

  const allDone = steps.length > 0 && completedSteps.length === steps.length;
  const progress =
    steps.length > 0 ? Math.min((completedSteps.length / steps.length) * 100, 100) : 0;

  if (!isOpen) {
    // 가이드가 닫혀있을 때만 다시보기 버튼 표시
    return (
      <button
        type="button"
        onClick={handleReopen}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[1050] flex items-center gap-1.5 md:gap-2 rounded-full border border-[#2C354B] bg-[#141824]/90 px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-[#F4F4F5] shadow-lg shadow-black/40 backdrop-blur transition hover:border-[#00C16A]/40 hover:text-[#00C16A]"
      >
        <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-[#00C16A]" />
        <span className="hidden sm:inline">가이드 다시 보기</span>
        <span className="sm:hidden">가이드</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-[1050] w-full max-w-xs sm:max-w-sm">
      <div className="relative overflow-hidden rounded-2xl border border-[#2E3038] bg-[#13161D]/95 shadow-2xl shadow-black/60 backdrop-blur-lg">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#00C16A]/15 via-transparent to-transparent" />

        <div className="relative px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#40424D] bg-[#1C2029]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#A1A1AA]">
                <Sparkles className="h-3.5 w-3.5 text-[#00C16A]" />
                {accentLabel || "킥-인 가이드"}
              </div>
              <h2 className="text-lg font-semibold text-[#F4F4F5]">{title}</h2>
              <p className="mt-1 text-sm text-[#A1A1AA]">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full border border-[#2E3038] p-1 text-[#70737B] transition hover:border-[#3F414B] hover:text-[#F4F4F5]"
              aria-label="가이드 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6F7280]">
            <Info className="h-4 w-4 text-[#00C16A]" />
            {allDone ? "모든 체크 완료!" : "체크리스트"}
          </div>

          <div className="space-y-3">
            {steps.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className="group flex items-start gap-3 rounded-xl border border-transparent bg-[#182135]/70 px-3 py-3 transition hover:border-[#2F313C] hover:bg-[#1E222B]/90"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStep(step.id)}
                    className="mt-0.5 rounded-full border border-[#2F313C] bg-[#14171E] p-1 transition hover:border-[#3F4A63] hover:bg-[#1B1F27]"
                    aria-label={`${step.title} 단계 ${isDone ? "완료 취소" : "완료"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-[#00C16A]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#3F414B]" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#F4F4F5]">
                      <span>{step.title}</span>
                      {isDone && (
                        <span className="rounded-full bg-[#00C16A]/10 px-2 py-0.5 text-xs font-semibold text-[#00E693]">
                          완료
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#8B8E99]">
                      {step.description}
                    </p>
                    {step.href && step.actionLabel && (
                      <Link
                        href={step.href}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#00C16A] transition hover:text-[#00E693]"
                      >
                        {step.actionLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1E212A]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00C16A] via-[#00E693] to-[#00C16A] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#6F7280]">
                {Math.round(progress)}%
              </span>

              {allDone ? (
                <Button
                  size="sm"
                  onClick={handleDismiss}
                  className="bg-[#00C16A] text-[#04130C] hover:bg-[#00E693]"
                >
                  가이드 완료
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDismiss}
                  className="border border-[#2F313C] bg-transparent text-[#A1A1AA] hover:border-[#3F414B] hover:text-[#F4F4F5]"
                >
                  나중에 할게요
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


