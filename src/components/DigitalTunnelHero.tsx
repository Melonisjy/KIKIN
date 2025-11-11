"use client";

import Link from "next/link";
import { BellRing, ArrowRight, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/digital-tunnel.module.scss";

type HeroState = "idle" | "pre" | "live" | "post" | "scheduled";

export interface FocusAction {
  id: string;
  title: string;
  description: string;
  href: string;
  accent?: "primary" | "secondary" | "emphasis";
}

interface DigitalTunnelHeroProps {
  isLoggedIn: boolean;
  teamName?: string | null;
  heroState: HeroState;
  heroHeadline: string;
  heroSubheadline: string;
  coachMessage: string;
  focusActions: FocusAction[];
  nextMatchInfo?: {
    label: string;
    location?: string | null;
  } | null;
  todayMatchesCount?: number;
  totalTeamsCount?: number;
}

const accentMap: Record<NonNullable<FocusAction["accent"]>, string> = {
  primary:
    "bg-[#00C16A]/18 text-[#9FF4D2] border border-[#00C16A]/35 hover:bg-[#00C16A]/28",
  secondary:
    "bg-[#222E45] text-[#A0AABE] border border-[#2C354B] hover:bg-[#1A2333]",
  emphasis:
    "bg-[#ffe352]/18 text-[#FFE352] border border-[#FFE352]/35 hover:bg-[#ffe352]/28 shadow-[0_12px_30px_rgba(60,45,0,0.45)]",
};

function renderStateBadge(state: HeroState) {
  const copy: Record<HeroState, { label: string; tone: string }> = {
    idle: {
      label: "팀 준비 완료",
      tone: "bg-[#1F2536] text-[#A0AABE]",
    },
    pre: {
      label: "킥오프 임박",
      tone: "bg-[#FFE352]/20 text-[#FFE352]",
    },
    live: {
      label: "경기 진행 중",
      tone: "bg-[#FF6B6B]/20 text-[#FF9B9B]",
    },
    post: {
      label: "하이라이트 감상",
      tone: "bg-[#9F7AEA]/20 text-[#C4B5FD]",
    },
    scheduled: {
      label: "라인업 예정",
      tone: "bg-[#38BDF8]/15 text-[#7DD3FC]",
    },
  };

  const config = copy[state];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.24em] whitespace-nowrap ${config.tone}`}
    >
      {config.label}
    </span>
  );
}

export function DigitalTunnelHero({
  isLoggedIn,
  teamName,
  heroState,
  heroHeadline,
  heroSubheadline,
  coachMessage,
  focusActions,
  nextMatchInfo,
  todayMatchesCount = 0,
  totalTeamsCount = 0,
}: DigitalTunnelHeroProps) {
  const displayTeam = teamName ? `${teamName} 라커룸` : "킥-인 라커룸";

  return (
    <section className="relative">
      <div className={`${styles.tunnel} border border-[var(--border-soft)]`}>
        <div className={styles.tunnelCore} />
        <div className={styles.tunnelGrid} />
        <div className={styles.lightSweep} />
        <div className={styles.matchPrepAnimation} />
        <div className={styles.tunnelContent}>
          {/* 실시간 통계 배지 */}
          {!isLoggedIn && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {todayMatchesCount > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-[#00C16A]/30 bg-[#00C16A]/10 px-4 py-2 backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-[#00C16A]" />
                  <span className="text-sm font-semibold text-[#9FF4D2]">
                    오늘 <span className="text-[#00C16A]">{todayMatchesCount}</span>팀이 경기 준비 중
                  </span>
                </div>
              )}
              {totalTeamsCount > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-[#00C16A]/30 bg-[#00C16A]/10 px-4 py-2 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-[#00C16A]" />
                  <span className="text-sm font-semibold text-[#9FF4D2]">
                    <span className="text-[#00C16A]">{totalTeamsCount.toLocaleString()}</span>팀이 사용 중
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              {renderStateBadge(heroState)}
              <h1 className="text-4xl font-bold tracking-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl">
                {heroHeadline}
              </h1>
              <p className="text-base text-[#CBD5F5] sm:text-lg">
                {heroSubheadline}
              </p>
              
              {/* 대형 CTA 버튼 (로그인 전) */}
              {!isLoggedIn && (
                <div className="pt-2">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="group relative h-14 w-full bg-gradient-to-r from-[#00C16A] to-[#00D97E] px-8 text-base font-bold text-[#0F1115] shadow-[0_8px_32px_rgba(0,193,106,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_48px_rgba(0,193,106,0.5)] sm:w-auto"
                    >
                      <span className="flex items-center gap-2">
                        지금 킥오프하기
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Button>
                  </Link>
                </div>
              )}

              <div className="rounded-xl bg-[#080A12]/60 px-4 py-3 text-sm text-[#94A3C8] backdrop-blur-sm sm:text-base">
                <span className="font-semibold text-[#E0ECFF]">AI 코치</span>가
                전하는 말 &mdash; {coachMessage}
              </div>
            </div>
            {isLoggedIn && nextMatchInfo ? (
              <div className="w-full max-w-sm rounded-2xl border border-[#2C354B] bg-[#101522]/75 p-5 shadow-elevated backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6F7FA5]">
                    다음 경기
                  </p>
                  <span className="rounded-full bg-[#00C16A]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8EF2C7]">
                    {displayTeam}
                  </span>
                </div>
                <p className="mt-4 text-xl font-semibold text-[#F8FAFC]">
                  {nextMatchInfo.label}
                </p>
                {nextMatchInfo.location ? (
                  <p className="mt-2 text-sm text-[#A0AABE]">
                    {nextMatchInfo.location}
                  </p>
                ) : null}
                <div className="mt-6 flex items-center gap-2 text-xs text-[#6F7FA5]">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2C354B] to-transparent" />
                  <span>라인업 준비</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2C354B] to-transparent" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(isLoggedIn ? focusActions : []).map((action) => {
              const accentClass = action.accent
                ? accentMap[action.accent]
                : accentMap.secondary;
              const isEmphasis = action.accent === "emphasis";
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`group relative flex flex-col gap-2 rounded-xl px-4 py-3 transition-all duration-200 ${accentClass}`}
                >
                  {isEmphasis && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFE352]">
                      <BellRing className="h-3.5 w-3.5 animate-pulse" />
                      투표 리마인더
                    </span>
                  )}
                  <span className="text-sm font-semibold text-[#F8FAFC] group-hover:translate-x-1 transition-transform duration-200">
                    {action.title}
                  </span>
                  <p className="text-xs text-[#A0AABE]">
                    {action.description}
                  </p>
                </Link>
              );
            })}

            {!isLoggedIn && (
              <div className="col-span-full">
                {/* 로그인 전 온보딩은 page.tsx에서 별도로 표시 */}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

