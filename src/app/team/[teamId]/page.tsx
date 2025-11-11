import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  Megaphone,
  Pin,
  UserPlus,
} from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { MatchListSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { DeleteTeam } from "./delete-team";
import { TeamCode } from "./team-code";
import { NoticesSection } from "./notices-section";
import { RemoveMember } from "./remove-member";
import { ApproveRequest } from "./approve-request";
import { TeamUpdateFeed, TeamUpdateItem } from "./team-update-feed";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 팀 정보 가져오기
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // 사용자가 이 팀의 멤버인지 확인
  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/locker-room");
  }

  // 팀원 목록 가져오기
  const { data: teamMembersRaw, error: membersError } = await supabase
    .from("members")
    .select("user_id, role, joined_at")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true }); // 가입 순서대로

  // 팀장을 맨 앞으로, 나머지는 가입 순서대로 정렬
  const teamMembers = teamMembersRaw
    ? [
        ...teamMembersRaw.filter((m: any) => m.role === "leader"),
        ...teamMembersRaw.filter((m: any) => m.role !== "leader"),
      ]
    : null;

  // 팀원들의 프로필 정보 가져오기
  const memberUserIds = teamMembers?.map((m: any) => m.user_id) || [];
  let memberProfileMap = new Map<string, string | null>();
  let leaderName: string | null = null;

  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", memberUserIds);

    memberProfileMap = new Map(profiles?.map((p: any) => [p.id, p.name]) || []);

    // 팀장 이름 찾기
    const leader = teamMembers?.find((m: any) => m.role === "leader");
    if (leader) {
      leaderName = memberProfileMap.get(leader.user_id) || null;
    }
  }

  // 팀의 경기 목록 가져오기 (날짜순 정렬)
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("team_id", teamId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  // 각 경기의 참여자 통계 가져오기
  const matchParticipantStats: Record<
    string,
    { going: number; notGoing: number; maybe: number }
  > = {};
  let matchParticipants: Array<{
    match_id: string;
    user_id: string;
    status: string;
  }> = [];
  if (matches && matches.length > 0) {
    const matchIds = matches.map((m: any) => m.id);
    const { data: participants } = await supabase
      .from("match_participants")
      .select("match_id, user_id, status")
      .in("match_id", matchIds);

    matchParticipants = participants || [];

    // 각 경기별로 통계 계산
    matchIds.forEach((matchId: string) => {
      const participantsForMatch =
        matchParticipants.filter((p: any) => p.match_id === matchId) || [];
      matchParticipantStats[matchId] = {
        going: participantsForMatch.filter((p: any) => p.status === "going")
          .length,
        notGoing: participantsForMatch.filter(
          (p: any) => p.status === "not_going"
        ).length,
        maybe: participantsForMatch.filter((p: any) => p.status === "maybe")
          .length,
      };
    });
  }

  // 팀 공지 전체 개수 가져오기
  const { count: noticesCount } = await supabase
    .from("team_notices")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  // 팀 공지 가져오기 (고정 공지 먼저, 최신순, 최대 10개)
  const { data: notices, error: noticesError } = await supabase
    .from("team_notices")
    .select("*")
    .eq("team_id", teamId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  // 공지 작성자 이름 맵 생성 (객체로 변환)
  const noticeAuthorMap: Record<string, string | null> = {};
  if (notices && notices.length > 0) {
    const authorIds = [
      ...new Set(notices.map((notice: any) => notice.created_by)),
    ];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, name")
        .in("id", authorIds);

      profiles?.forEach((profile: any) => {
        noticeAuthorMap[profile.id] = profile.name;
      });
    }
  }

  const isLeader = member.role === "leader";

  const onboardingSteps = isLeader
    ? [
        {
          id: "team-notice",
          title: "팀 공지 작성",
          description:
            "상단 ‘공지’ 섹션에서 팀원들에게 전달할 중요한 메시지를 작성하고 상단 고정해 보세요.",
        },
        {
          id: "approve-requests",
          title: "가입 요청 관리",
          description:
            "새로 들어온 가입 요청을 빠르게 확인하고 승인·거절로 팀 멤버 구성을 관리하세요.",
        },
        {
          id: "plan-match",
          title: "경기 일정 만들기",
          description:
            "‘경기 일정’ 카드에서 새 경기를 생성하고 팀원들의 투표를 받아 스케줄을 확정하세요.",
        },
      ]
    : [
        {
          id: "review-notice",
          title: "팀 공지 확인",
          description:
            "고정된 공지부터 최신 소식까지 확인하여 팀에서 필요한 정보를 놓치지 마세요.",
        },
        {
          id: "vote-match",
          title: "경기 투표 참여",
          description:
            "다가오는 경기 카드에서 참석 여부를 남겨 팀원들과 스케줄을 맞춰 보세요.",
        },
        {
          id: "know-teammates",
          title: "팀원 정보 살펴보기",
          description:
            "팀원 카드에서 역할과 가입일을 확인하고 커뮤니케이션 포인트를 준비해 보세요.",
        },
      ];

  // 가입 요청 가져오기 (팀장만)
  let teamRequests: any[] = [];
  let requestsError = null;
  let requestProfileMap = new Map<string, string | null>();

  if (isLeader) {
    const { data: requests, error: reqError } = await supabase
      .from("team_requests")
      .select("id, user_id, created_at")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    requestsError = reqError;
    teamRequests = requests || [];

    // 가입 요청한 사용자들의 프로필 정보 가져오기
    if (teamRequests.length > 0) {
      const requestUserIds = teamRequests.map((r: any) => r.user_id);
      const { data: requestProfiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, name")
        .in("id", requestUserIds);

      if (profileError) {
        console.error("프로필 조회 오류:", profileError);
      }

      requestProfileMap = new Map(
        requestProfiles?.map((p: any) => [p.id, p.name]) || []
      );
    }
  }

  const totalMembers = teamMembers?.length ?? 0;
  const totalMatches = matches?.length ?? 0;
  const nowDate = new Date();
  const upcomingMatchesCount = matches
    ? matches.filter((match: any) => {
        if (!match?.date) return false;
        const dateTimeString = match.time
          ? `${match.date}T${match.time}`
          : `${match.date}T00:00`;
        const matchDate = new Date(dateTimeString);
        if (Number.isNaN(matchDate.getTime())) {
          return false;
        }
        return matchDate >= nowDate;
      }).length
    : 0;
  const totalNotices = notices?.length ?? 0;
  const pinnedNoticesCount =
    notices?.filter((notice: any) => notice.is_pinned)?.length ?? 0;
  const pendingRequestsCount = teamRequests.length;

  const summaryStats = [
    {
      id: "members",
      label: "팀원",
      value: totalMembers,
      helper: "리더 포함",
      icon: Users,
      accentBg: "bg-[#00C16A]/15",
      accentColor: "text-[#00E693]",
    },
    {
      id: "upcoming",
      label: "다가오는 경기",
      value: upcomingMatchesCount,
      helper: `총 ${totalMatches}경기`,
      icon: Calendar,
      accentBg: "bg-[#2563EB]/12",
      accentColor: "text-[#60A5FA]",
    },
    {
      id: "notices",
      label: "등록 공지",
      value: totalNotices,
      helper: pinnedNoticesCount ? `고정 ${pinnedNoticesCount}건` : "고정 없음",
      icon: Megaphone,
      accentBg: "bg-[#F97316]/12",
      accentColor: "text-[#FB923C]",
    },
  ];

  if (isLeader) {
    summaryStats.push({
      id: "requests",
      label: "대기 요청",
      value: pendingRequestsCount,
      helper: pendingRequestsCount ? "승인 필요" : "대기 없음",
      icon: UserPlus,
      accentBg: "bg-[#FACC15]/12",
      accentColor: "text-[#FBBF24]",
    });
  } else {
    summaryStats.push({
      id: "pinned",
      label: "상단 고정",
      value: pinnedNoticesCount,
      helper: `${totalNotices}건 중`,
      icon: Pin,
      accentBg: "bg-[#7C3AED]/12",
      accentColor: "text-[#C084FC]",
    });
  }

  const combineDateTime = (date?: string | null, time?: string | null) => {
    if (!date) return null;
    const normalizedTime = time && time.length >= 4 ? time : "00:00";
    return `${date}T${normalizedTime}`;
  };

  const formatMatchDateTime = (match: any) => {
    const dateTimeString = combineDateTime(match?.date, match?.time);
    if (!dateTimeString) return "일정 미정";
    const date = new Date(dateTimeString);
    if (Number.isNaN(date.getTime())) return "일정 미정";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  };

  const truncate = (value: string, limit = 100) => {
    const trimmed = value.replace(/\s+/g, " ").trim();
    if (trimmed.length <= limit) return trimmed;
    return `${trimmed.slice(0, limit - 1)}…`;
  };

  const ensureTimestamp = (value?: string | null) =>
    value ?? new Date().toISOString();

  const noticeFeedItems: TeamUpdateItem[] = (notices ?? []).map(
    (notice: any) => {
      const authorName = noticeAuthorMap[notice.created_by] || null;
      const content =
        typeof notice.content === "string" ? truncate(notice.content, 120) : "";
      return {
        id: `notice-${notice.id}`,
        type: "notice" as const,
        title: authorName
          ? `${authorName}님의 팀 공지`
          : "새 팀 공지가 등록되었습니다",
        description: content || null,
        timestamp: ensureTimestamp(notice.updated_at || notice.created_at),
        meta: authorName ? `작성자: ${authorName}` : null,
      };
    }
  );

  const matchFeedItems: TeamUpdateItem[] = (matches ?? []).map(
    (match: any) => {
      const scheduleLabel = formatMatchDateTime(match);
      let titlePrefix = "새 매치 편성";

      if (match.status === "cancelled") {
        titlePrefix = "매치가 취소되었습니다";
      } else if (match.status === "confirmed") {
        titlePrefix = "매치 일정이 확정되었습니다";
      }

      return {
        id: `match-${match.id}`,
        type: "match" as const,
        title: titlePrefix,
        description: match.location || null,
        timestamp: ensureTimestamp(
          match.updated_at ||
            match.created_at ||
            combineDateTime(match.date, match.time)
        ),
        meta: scheduleLabel,
      };
    }
  );

  const pendingVoteMatches =
    matches?.filter((match: any) => {
      const scheduleString = combineDateTime(match?.date, match?.time);
      if (!scheduleString) return false;
      const matchDate = new Date(scheduleString);
      if (Number.isNaN(matchDate.getTime())) return false;
      if (matchDate.getTime() < Date.now()) return false;
      if (match.status === "cancelled") return false;

      const hasVoted = matchParticipants.some(
        (participant) =>
          participant.match_id === match.id && participant.user_id === user.id
      );
      return !hasVoted;
    }) ?? [];

  const voteFeedItems: TeamUpdateItem[] = pendingVoteMatches.map(
    (match: any) => {
      const scheduleLabel = formatMatchDateTime(match);
      return {
        id: `vote-${match.id}`,
        type: "vote" as const,
        title: "투표 요청이 도착했어요",
        description: match.location || null,
        timestamp: ensureTimestamp(
          match.updated_at ||
            match.created_at ||
            combineDateTime(match.date, match.time)
        ),
        meta: scheduleLabel,
      };
    }
  );

  const teamUpdates: TeamUpdateItem[] = [...noticeFeedItems, ...matchFeedItems, ...voteFeedItems]
    .filter((item) => item.timestamp)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  return (
    <>
      <OnboardingGuide
        storageKey={`team-detail-${isLeader ? "leader" : "member"}`}
        title={isLeader ? "팀 운영 체크리스트" : "팀 합류 가이드"}
        subtitle={
          isLeader
            ? "팀장이 자주 사용하는 핵심 흐름을 순서대로 완료해 보세요."
            : "팀 생활에 적응하는 데 필요한 필수 동선을 정리했어요."
        }
        accentLabel="팀 상세 온보딩"
        steps={onboardingSteps}
      />
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/locker-room"
          className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          라커룸으로 돌아가기
        </Link>

        <div className="space-y-6">
          <TeamUpdateFeed items={teamUpdates} />
          <div className="grid gap-6 xl:grid-cols-12">
            <section className="xl:col-span-8">
              <div
                className="surface-layer rounded-lg p-6 h-full transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                data-variant="elevated"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline flex-wrap gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-[#F4F4F5]">
                        {team.name}
                      </h1>
                      {leaderName && (
                        <span className="text-sm text-[#A1A1AA] leading-none">
                          팀장: {leaderName}
                        </span>
                      )}
                      <TeamCode teamId={teamId} />
                    </div>
                    {team.description && (
                      <p className="text-[#A1A1AA] mb-2">{team.description}</p>
                    )}
                    <div className="text-sm text-[#A1A1AA]">
                      생성일:{" "}
                      {new Date(team.created_at).toLocaleDateString("ko-KR")}
                    </div>

                    {isLeader && (
                      <div className="mt-4">
                        <DeleteTeam
                          teamId={teamId}
                          teamName={team.name}
                          isLeader={isLeader}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-medium uppercase tracking-[0.2em] ${
                      isLeader
                        ? "bg-primary/10 text-primary"
                        : "bg-[#202A3B] text-[#A0AABE]"
                    }`}
                  >
                    {isLeader ? "팀장" : "멤버"}
                  </span>
                </div>
              </div>
            </section>

            <aside className="xl:col-span-4">
              <div
                className="surface-layer rounded-lg p-6 h-full transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                data-variant="subtle"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#F4F4F5]">
                    팀 스냅샷
                  </h2>
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6F7280]">
                    overview
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {summaryStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.id}
                        className="flex items-center gap-3 rounded-xl border border-[#2A2C34] bg-[#182135] px-4 py-3"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.accentBg} ${stat.accentColor}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6F7280]">
                            {stat.label}
                          </p>
                          <p className="text-xl font-semibold text-[#F4F4F5]">
                            {stat.value}
                          </p>
                          <p className="text-xs text-[#6F7280]">
                            {stat.helper}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <section className="space-y-6 xl:col-span-8">
              <NoticesSection
                teamId={teamId}
                notices={notices || []}
                noticesError={noticesError}
                isLeader={isLeader}
                noticeAuthorMap={noticeAuthorMap}
                totalCount={noticesCount || 0}
              />

              <div
                className="surface-layer rounded-lg p-6 transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                data-variant="elevated"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-[#F4F4F5]" />
                    <h2 className="text-2xl font-semibold text-[#F4F4F5]">
                      경기 일정
                    </h2>
                    <span className="text-sm text-[#A1A1AA]">
                      ({totalMatches}경기)
                    </span>
                  </div>
                  {isLeader && (
                    <Link href={`/match/new?teamId=${teamId}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />새 경기 만들기
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="mt-4">
                  {matchesError ? (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive transition-all duration-200">
                      <p>경기 정보를 불러오는 중 오류가 발생했습니다.</p>
                      <p className="mt-2 text-sm">{matchesError.message}</p>
                    </div>
                  ) : matches && matches.length > 0 ? (
                    <Suspense fallback={<MatchListSkeleton />}>
                      <div className="space-y-4">
                        {matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            showTeam={false}
                            participantStats={matchParticipantStats[match.id]}
                          />
                        ))}
                      </div>
                    </Suspense>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#2C354B] bg-[#1A2333]/55 p-10 text-center transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#223149] hover:-translate-y-0.5">
                      <p className="text-[#A1A1AA] mb-4">
                        아직 예정된 경기가 없습니다.
                      </p>
                      {isLeader && (
                        <Link href={`/match/new?teamId=${teamId}`}>
                          <Button variant="secondary">
                            <Plus className="mr-2 h-4 w-4" />첫 경기 만들기
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6 xl:col-span-4">
              {isLeader && (
                <div
                  className="surface-layer rounded-lg p-6 transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                  data-variant="elevated"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-[#00C16A]" />
                      <h2 className="text-lg font-semibold text-[#F4F4F5]">
                        가입 요청
                      </h2>
                    </div>
                    {pendingRequestsCount > 0 && (
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">
                        {pendingRequestsCount}건
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {requestsError ? (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive transition-all duration-200">
                        <p>가입 요청 정보를 불러오는 중 오류가 발생했습니다.</p>
                        <p className="mt-2 text-sm">{requestsError.message}</p>
                      </div>
                    ) : teamRequests.length > 0 ? (
                      teamRequests.map((request: any) => {
                        const requestName = requestProfileMap.get(
                          request.user_id
                        );

                        return (
                          <div
                            key={request.id}
                            className="interactive-surface flex items-center justify-between gap-3 rounded-lg border border-[#2A2C34] bg-[#182135] px-3 py-3 transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#202B3C] hover:-translate-y-0.5"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C16A]/20 text-[#00E693] text-sm font-semibold">
                                {requestName
                                  ? requestName.charAt(0).toUpperCase()
                                  : request.user_id.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-[#F4F4F5] truncate">
                                    {requestName || "이름 없음"}
                                  </span>
                                </div>
                                <p className="text-xs text-[#A1A1AA]">
                                  요청일:{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString("ko-KR")}
                                </p>
                              </div>
                            </div>
                            <ApproveRequest
                              requestId={request.id}
                              userId={request.user_id}
                              teamId={teamId}
                              isLeader={isLeader}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#2A2C34] bg-[#182135] p-6 text-center transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#202B3C] hover:-translate-y-0.5">
                        <p className="text-[#A1A1AA]">
                          대기 중인 가입 요청이 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                className="surface-layer rounded-lg p-6 transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                data-variant="elevated"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#F4F4F5]" />
                    <h2 className="text-lg font-semibold text-[#F4F4F5]">
                      팀원
                    </h2>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">
                    {totalMembers}명
                  </span>
                </div>

                {membersError ? (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive transition-all duration-200">
                    <p>팀원 정보를 불러오는 중 오류가 발생했습니다.</p>
                    <p className="mt-2 text-sm">{membersError.message}</p>
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((memberItem: any) => {
                      const memberName =
                        memberProfileMap.get(memberItem.user_id) || null;
                      const isMemberLeader = memberItem.role === "leader";
                      const isCurrentUser = memberItem.user_id === user.id;

                      return (
                        <div
                          key={memberItem.user_id}
                          className="interactive-surface flex items-center gap-3 rounded-lg border border-[#2A2C34] bg-[#182135] px-3 py-3 transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#202B3C] hover:-translate-y-0.5"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C16A]/15 text-[#00E693] text-sm font-semibold">
                            {memberName
                              ? memberName.charAt(0).toUpperCase()
                              : memberItem.user_id.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#F4F4F5] truncate">
                                {memberName || "이름 없음"}
                              </span>
                              {isMemberLeader ? (
                                <span className="rounded-full bg-[#00C16A]/10 text-[#00C16A] px-2 py-0.5 text-xs font-medium">
                                  팀장
                                </span>
                              ) : (
                                <span className="rounded-full bg-[#202A3B] text-[#A0AABE] px-2 py-0.5 text-xs font-medium">
                                  멤버
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="text-xs text-[#A1A1AA]">
                                  (나)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A1A1AA]">
                              가입일:{" "}
                              {new Date(
                                memberItem.joined_at
                              ).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          {isLeader && !isCurrentUser && (
                            <RemoveMember
                              teamId={teamId}
                              memberId={memberItem.user_id}
                              memberName={memberName}
                              isLeader={isLeader}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#2A2C34] bg-[#182135] p-6 text-center transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#202B3C] hover:-translate-y-0.5">
                    <p className="text-[#A1A1AA]">팀원이 없습니다.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
