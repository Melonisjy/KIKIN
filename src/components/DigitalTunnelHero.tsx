"use client";

import Link from "next/link";
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
}

const accentMap: Record<
  NonNullable<FocusAction["accent"]>,
  string
> = {
  primary:
    "bg-[#00C16A]/18 text-[#9FF4D2] border border-[#00C16A]/35 hover:bg-[#00C16A]/28",
  secondary:
    "bg-[#222E45] text-[#A0AABE] border border-[#2C354B] hover:bg-[#1A2333]",
  emphasis:
    "bg-[#ffe352]/15 text-[#FFE352] border border-[#FFE352]/30 hover:bg-[#ffe352]/25",
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${config.tone}`}
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
}: DigitalTunnelHeroProps) {
  const displayTeam = teamName ? `${teamName} 라커룸` : "킥-인 라커룸";

  return (
    <section className="relative">
      <div className={`${styles.tunnel} border border-[var(--border-soft)]`}>
        <div className={styles.tunnelCore} />
        <div className={styles.tunnelGrid} />
        <div className={styles.lightSweep} />
        <div className={styles.tunnelContent}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              {renderStateBadge(heroState)}
              <h1 className="text-4xl font-bold tracking-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl">
                {heroHeadline}
              </h1>
              <p className="text-base text-[#CBD5F5] sm:text-lg">
                {heroSubheadline}
              </p>
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
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`group flex flex-col gap-2 rounded-xl px-4 py-3 transition-all duration-200 ${accentClass}`}
                >
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
              <>
                <Link
                  href="/login"
                  className={`${accentMap.primary} group flex flex-col gap-2 rounded-xl px-4 py-3 transition-all duration-200`}
                >
                  <span className="text-sm font-semibold text-[#F8FAFC] group-hover:translate-x-1 transition-transform duration-200">
                    킥-인 라커룸 입장
                  </span>
                  <p className="text-xs text-[#A0AABE]">
                    풋살 팀 스케줄을 한 곳에서 관리하고, 경기 라인업을 정비하세요.
                  </p>
                </Link>
                <Link
                  href="/locker-room"
                  className={`${accentMap.secondary} flex flex-col gap-2 rounded-xl px-4 py-3 transition-all duration-200`}
                >
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    서비스 둘러보기
                  </span>
                  <p className="text-xs text-[#A0AABE]">
                    라커룸 기능과 경기 브리핑, 공지 기능을 미리 엿볼 수 있어요.
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

