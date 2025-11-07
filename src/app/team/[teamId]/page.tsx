import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Calendar, Megaphone, Pin } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { MatchListSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { DeleteTeam } from "./delete-team";
import { TeamCode } from "./team-code";
import { NoticesSection } from "./notices-section";
import { RemoveMember } from "./remove-member";

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
  const matchParticipantStats: Record<string, { going: number; notGoing: number; maybe: number }> = {};
  if (matches && matches.length > 0) {
    const matchIds = matches.map((m: any) => m.id);
    const { data: participants } = await supabase
      .from("match_participants")
      .select("match_id, status")
      .in("match_id", matchIds);

    // 각 경기별로 통계 계산
    matchIds.forEach((matchId: string) => {
      const matchParticipants = participants?.filter((p: any) => p.match_id === matchId) || [];
      matchParticipantStats[matchId] = {
        going: matchParticipants.filter((p: any) => p.status === "going").length,
        notGoing: matchParticipants.filter((p: any) => p.status === "not_going").length,
        maybe: matchParticipants.filter((p: any) => p.status === "maybe").length,
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
    const authorIds = [...new Set(notices.map((notice: any) => notice.created_by))];
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/locker-room"
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        라커룸으로 돌아가기
      </Link>

      {/* 팀 정보 */}
      <div className="rounded-lg border border-[#27272A] bg-[#181A1F] p-6 mb-6">
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
              생성일: {new Date(team.created_at).toLocaleDateString("ko-KR")}
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
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              isLeader
                ? "bg-primary/10 text-primary"
                : "bg-[#27272A] text-[#A1A1AA]"
            }`}
          >
            {isLeader ? "팀장" : "멤버"}
          </span>
        </div>
      </div>

      {/* 공지 섹션 */}
      <NoticesSection
        teamId={teamId}
        notices={notices || []}
        noticesError={noticesError}
        isLeader={isLeader}
        noticeAuthorMap={noticeAuthorMap}
        totalCount={noticesCount || 0}
      />

      {/* 팀원 목록 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6 text-[#F4F4F5]" />
          <h2 className="text-2xl font-semibold text-[#F4F4F5]">팀원</h2>
          <span className="text-sm text-[#A1A1AA]">
            ({teamMembers?.length || 0}명)
          </span>
        </div>

        {membersError ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <p>팀원 정보를 불러오는 중 오류가 발생했습니다.</p>
            <p className="mt-2 text-sm">{membersError.message}</p>
          </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <div className="rounded-lg border border-[#27272A] bg-[#181A1F] p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((memberItem: any) => {
                const memberName = memberProfileMap.get(memberItem.user_id);
                const isMemberLeader = memberItem.role === "leader";
                const isCurrentUser = memberItem.user_id === user.id;

                return (
                  <div
                    key={memberItem.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#27272A]/50 border border-[#27272A]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C16A] text-[#0F1115] text-sm font-semibold">
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
                          <span className="rounded-full bg-[#27272A] text-[#A1A1AA] px-2 py-0.5 text-xs font-medium">
                            멤버
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-[#A1A1AA]">(나)</span>
                        )}
                      </div>
                      <p className="text-xs text-[#A1A1AA]">
                        가입일: {new Date(memberItem.joined_at).toLocaleDateString("ko-KR")}
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
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#27272A] bg-[#27272A]/50 p-8 text-center">
            <p className="text-[#A1A1AA]">팀원이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 경기 목록 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-[#F4F4F5]" />
          <h2 className="text-2xl font-semibold text-[#F4F4F5]">경기 일정</h2>
        </div>
        {isLeader && (
          <Link href={`/match/new?teamId=${teamId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 경기 만들기
            </Button>
          </Link>
        )}
      </div>

      {matchesError ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
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
        <div className="rounded-lg border border-dashed border-[#27272A] bg-[#27272A]/50 p-12 text-center">
          <p className="text-[#A1A1AA] mb-4">
            아직 예정된 경기가 없습니다.
          </p>
          {isLeader && (
            <Link href={`/match/new?teamId=${teamId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                첫 경기 만들기
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

