import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Calendar, CheckCircle, Zap, ArrowRight } from "lucide-react";
import { DigitalTunnelHero, FocusAction } from "@/components/DigitalTunnelHero";

type HeroState = "idle" | "pre" | "live" | "post" | "scheduled";

function parseMatchDateTime(date?: string | null, time?: string | null) {
  if (!date) return null;
  const trimmedTime = time ? time.slice(0, 5) : "00:00";
  const candidate = new Date(`${date}T${trimmedTime}`);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
}

function formatMatchLabel(date?: string | null, time?: string | null) {
  const dateTime = parseMatchDateTime(date, time);
  if (!dateTime) return "일정 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(dateTime);
}

function determineHeroState(
  nextMatchDate: Date | null,
  lastMatchDate: Date | null
): HeroState {
  const now = new Date();
  if (nextMatchDate) {
    const diffMs = nextMatchDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0 && diffHours >= -2) {
      return "live";
    }
    if (diffMs > 0 && diffHours <= 3) {
      return "pre";
    }
    if (diffHours > 3) {
      return "scheduled";
    }
    if (diffMs <= 0 && diffHours < -2 && diffHours >= -24) {
      return "post";
    }
    return diffMs > 0 ? "scheduled" : "idle";
  }

  if (lastMatchDate) {
    const diffHours =
      (now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 24) {
      return "post";
    }
  }

  return "idle";
}

function getHeroCopy(state: HeroState, teamName?: string | null) {
  const baseTeam = teamName ? `${teamName}` : "라커룸";
  switch (state) {
    case "pre":
      return {
        headline: `${baseTeam}, 킥오프가 코앞입니다`,
        subheadline:
          "라인업을 마지막으로 점검하고, 경기장을 달굴 준비를 하세요.",
        coach: "곧 경기 시작! 출석 미정자에게 마지막 알림을 보내볼까요?",
      };
    case "live":
      return {
        headline: "경기 진행 중",
        subheadline:
          "허들 모드에서 현재 상황을 공유하고 실시간으로 라인업을 조정해요.",
        coach: "필요하면 공지로 포메이션 변경을 알려주세요.",
      };
    case "post":
      return {
        headline: "하이라이트 감상 시간",
        subheadline:
          "방금 끝난 경기의 기록과 피드백을 정리하여 다음 경기를 준비하세요.",
        coach: "최대 24시간 내 회고를 남기면 팀 성장 지표가 더 정확해집니다.",
      };
    case "scheduled":
      return {
        headline: "다음 라인업을 예약하세요",
        subheadline:
          "곧 다가올 경기의 출석 상태를 모으고, 필요한 포지션을 미리 조율해 보세요.",
        coach: "출석률이 높은 시간대를 참고해 투표 마감 시간을 설정해보세요.",
      };
    case "idle":
    default:
      return {
        headline: "킥-인과 함께 라인업을 준비하세요",
        subheadline:
          "팀 스케줄과 출석을 라커룸에서 한 번에 정리하고, 킥오프에만 집중하세요.",
        coach: "새 팀을 만들거나 합류 코드를 받아 등록해 보세요.",
      };
  }
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 실시간 통계 가져오기 (API 라우트 사용)
  let todayMatchesCount = 0;
  let totalTeamsCount = 0;

  try {
    const statsResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/stats`,
      { cache: "no-store" }
    );
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      todayMatchesCount = stats.todayMatchesCount || 0;
      totalTeamsCount = stats.totalTeamsCount || 0;
    }
  } catch (error) {
    // 통계 조회 실패 시 기본값 사용
    console.error("통계 조회 실패:", error);
  }

  let teamName: string | null = null;
  let isLeader = false;
  let focusActions: FocusAction[] = [];
  let nextMatchInfo: { label: string; location?: string | null } | null = null;
  let heroState: HeroState = "idle";
  let coachMessage = getHeroCopy(heroState).coach;
  let heroHeadline = getHeroCopy(heroState).headline;
  let heroSubheadline = getHeroCopy(heroState).subheadline;

  if (user) {
    const { data: memberships } = await supabase
      .from("members")
      .select("team_id, role, teams(name)")
      .eq("user_id", user.id);

    const membershipList = (memberships as any[]) ?? [];
    const teamIds = membershipList
      .map((membership) => membership.team_id)
      .filter(Boolean);

    teamName = membershipList[0]?.teams?.name || null;
    isLeader = membershipList.some(
      (membership) => membership.role === "leader"
    );

    if (teamIds.length > 0) {
      const { data: matchesData } = await supabase
        .from("matches")
        .select(
          "id, team_id, date, time, location, status, created_at, updated_at"
        )
        .in("team_id", teamIds)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(40);

      const matches = matchesData || [];
      const matchEntries = matches
        .map((match) => ({
          match,
          dateTime: parseMatchDateTime(match.date, match.time),
        }))
        .filter((entry) => entry.dateTime !== null) as {
        match: (typeof matches)[number];
        dateTime: Date;
      }[];

      const now = new Date();
      const sortedEntries = matchEntries.sort(
        (a, b) => a.dateTime.getTime() - b.dateTime.getTime()
      );

      const upcomingEntry = sortedEntries.find(
        (entry) => entry.dateTime.getTime() >= now.getTime()
      );
      const pastEntry = [...sortedEntries]
        .filter((entry) => entry.dateTime.getTime() < now.getTime())
        .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())[0];

      if (upcomingEntry) {
        heroState = determineHeroState(
          upcomingEntry.dateTime,
          pastEntry?.dateTime || null
        );
        nextMatchInfo = {
          label: formatMatchLabel(
            upcomingEntry.match.date,
            upcomingEntry.match.time
          ),
          location: upcomingEntry.match.location || null,
        };
      } else {
        heroState = determineHeroState(null, pastEntry?.dateTime || null);
      }

      const { data: participationData } = await supabase
        .from("match_participants")
        .select("match_id")
        .eq("user_id", user.id)
        .in(
          "match_id",
          matches.map((match) => match.id)
        );

      const participatedMatchIds = new Set(
        (participationData || []).map((row) => row.match_id)
      );

      const upcomingDiffMs = upcomingEntry
        ? upcomingEntry.dateTime.getTime() - now.getTime()
        : null;

      if (
        upcomingEntry &&
        upcomingDiffMs !== null &&
        upcomingDiffMs > 0 &&
        upcomingDiffMs <= 24 * 60 * 60 * 1000
      ) {
        focusActions.push({
          id: "lineup-check",
          title: "라인업 마지막 점검",
          description:
            "킥오프 전까지 출석을 마무리하고 전략 공지를 공유하세요.",
          href: "/locker-room",
          accent: "primary",
        });
      }

      if (
        upcomingEntry &&
        upcomingDiffMs !== null &&
        upcomingDiffMs > 0 &&
        !participatedMatchIds.has(upcomingEntry.match.id)
      ) {
        focusActions.push({
          id: "vote-reminder",
          title: "출석 투표 남기기",
          description:
            "아직 출석을 남기지 않았어요. 라커룸에서 투표를 완료해 보세요.",
          href: `/match/${upcomingEntry.match.id}`,
          accent: "emphasis",
        });
      }

      if (heroState === "post" && pastEntry) {
        focusActions.push({
          id: "highlight-review",
          title: "하이라이트 정리",
          description: "직전 경기 기록과 피드백을 정리해 다음 경기를 준비해요.",
          href: `/match/${pastEntry.match.id}`,
          accent: "secondary",
        });
      }
    }

    if (isLeader) {
      const firstTeamId = membershipList[0]?.team_id;
      if (firstTeamId) {
        focusActions.push({
          id: "create-match",
          title: "새 매치 편성",
          description: "다음 스케줄을 빠르게 생성하고 팀원들에게 공유하세요.",
          href: `/match/new?teamId=${firstTeamId}`,
          accent: "secondary",
        });
      }
    }

    focusActions.push({
      id: "open-locker-room",
      title: "라커룸 열기",
      description: "팀 공지, 경기 브리핑, 출석 현황을 한눈에 살펴보세요.",
      href: "/locker-room",
      accent: "secondary",
    });

    if (focusActions.length > 0) {
      const uniqueMap = new Map<string, FocusAction>();
      focusActions.forEach((action) => {
        if (!uniqueMap.has(action.id)) {
          uniqueMap.set(action.id, action);
        }
      });
      focusActions = Array.from(uniqueMap.values());
    }

    const heroCopy = getHeroCopy(heroState, teamName);
    heroHeadline = heroCopy.headline;
    heroSubheadline = heroCopy.subheadline;
    coachMessage = heroCopy.coach;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <DigitalTunnelHero
          isLoggedIn={Boolean(user)}
          teamName={teamName}
          heroState={heroState}
          heroHeadline={heroHeadline}
          heroSubheadline={heroSubheadline}
          coachMessage={coachMessage}
          focusActions={focusActions}
          nextMatchInfo={nextMatchInfo}
          todayMatchesCount={todayMatchesCount || 0}
          totalTeamsCount={totalTeamsCount || 0}
        />
      </section>

      {/* Features Section */}
      <section className="border-t border-[#2C354B] bg-[#121929] py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[#F4F4F5] sm:text-4xl">
              킥-인 라커룸 하이라이트
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Users className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  라인업 구성
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  팀 코드를 공유해 팀원을 합류시키고, 라커룸에서 선수단 정보를
                  정비하세요.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Calendar className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  매치 스케줄링
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  경기 날짜·시간·구장을 라인업처럼 정리하고, 킥오프 정보를
                  팀원들과 공유하세요.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <CheckCircle className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  출석 체크
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  참석·불참·미정을 받아 라인업 공석을 확인하고, 확정된 멤버로
                  작전을 세워보세요.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Zap className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  경기 브리핑
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  카카오톡 없이도 경기 정보와 변경 사항을 빠르게 공지하고 확인할
                  수 있습니다.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Users className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  감독 모드
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  팀장은 경기 편성, 공지, 멤버 관리를 한 화면에서 지휘할 수
                  있습니다.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="surface-layer rounded-xl p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2C354B] bg-[#141824]">
                  <Calendar className="h-6 w-6 text-[#00C16A]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">
                  빠른 합류
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  Google 계정으로 로그인해 라커룸에 합류하고, 매치 브리핑을 바로
                  확인하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="surface-layer mx-auto max-w-2xl rounded-xl p-8 text-center transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
          <h2 className="text-2xl font-bold text-[#00C16A] sm:text-3xl">
            지금 바로 킥오프하세요
          </h2>
          <p className="mt-4 text-[#A1A1AA]">
            킥-인 라커룸에서 팀 스케줄과 출석을 한 번에 정리해 보세요.
          </p>
          <div className="mt-8">
            {!user ? (
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  무료로 킥오프
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/locker-room">
                <Button size="lg" className="w-full sm:w-auto">
                  라커룸 입장
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
