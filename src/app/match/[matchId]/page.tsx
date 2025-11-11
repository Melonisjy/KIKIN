import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  HelpCircle,
  MinusCircle,
} from "lucide-react";
import { MatchParticipantButtons } from "./participant-buttons";
import { DeleteMatch } from "./delete-match";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { matchId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 경기 정보 가져오기
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      `
      *,
      teams (
        id,
        name,
        description
      )
    `
    )
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const team = match.teams as any;

  // 사용자가 이 팀의 멤버인지 확인
  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/locker-room");
  }

  // 팀 멤버 목록 가져오기
  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("members")
    .select("user_id, role, joined_at")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  // 투표자 목록 가져오기
  const { data: participants, error: participantsError } = await supabase
    .from("match_participants")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  // 투표자들의 프로필 정보 가져오기
  const participantUserIds = participants?.map((p: any) => p.user_id) || [];
  const teamMemberUserIds = teamMembers?.map((m: any) => m.user_id) || [];
  const allUserIds = Array.from(
    new Set([...participantUserIds, ...teamMemberUserIds])
  );
  let profileMap = new Map<string, string | null>();

  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", allUserIds);

    // 프로필 맵 생성 (user_id -> name)
    profileMap = new Map(profiles?.map((p: any) => [p.id, p.name]) || []);
  }

  // 현재 사용자의 참여 상태
  const userParticipant = participants?.find((p: any) => p.user_id === user.id);

  const matchDate = new Date(`${match.date}T${match.time}`);
  const isPast = matchDate < new Date();

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-400",
    confirmed: "bg-[#00C16A]/10 text-[#00C16A]",
    cancelled: "bg-red-500/10 text-red-400",
  };

  // 투표자 통계
  const goingCount =
    participants?.filter((p: any) => p.status === "going").length || 0;
  const notGoingCount =
    participants?.filter((p: any) => p.status === "not_going").length || 0;
  const maybeCount =
    participants?.filter((p: any) => p.status === "maybe").length || 0;
  const totalMembers = teamMembers?.length || 0;
  const participantsByUserId = new Map(
    participants?.map((p: any) => [p.user_id, p]) || []
  );
  const notVotedCount =
    teamMembers?.filter((m: any) => !participantsByUserId.has(m.user_id))
      .length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href={`/team/${team.id}`}
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {team.name}으로 돌아가기
      </Link>

      {/* 매치 브리핑 */}
      <div className="surface-layer rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#A1A1AA] flex-shrink-0" />
              <span className="text-base sm:text-xl font-semibold text-[#F4F4F5] whitespace-nowrap">
                {matchDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
              <span className="text-sm sm:text-lg text-[#A1A1AA] whitespace-nowrap">
                {match.time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#A1A1AA] flex-shrink-0" />
              <span className="text-sm sm:text-base text-[#A1A1AA] whitespace-nowrap">{match.location}</span>
            </div>
            {match.note && (
              <div className="mt-4 rounded-lg bg-[#1A2333]/70 p-4">
                <p className="text-sm text-[#A0AABE]">{match.note}</p>
              </div>
            )}
            {member.role === "leader" && (
              <div className="mt-4">
                <DeleteMatch
                  matchId={matchId}
                  matchDate={match.date}
                  isLeader={member.role === "leader"}
                />
              </div>
            )}
          </div>
          <span
          className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
            isPast
              ? "bg-[#202A3B] text-[#A0AABE]"
              : statusColors[match.status as keyof typeof statusColors] ||
                statusColors.upcoming
          }`}
          >
            {isPast
              ? "종료"
              : match.status === "upcoming"
              ? "예정"
              : match.status === "confirmed"
              ? "확정"
              : "취소"}
          </span>
        </div>
      </div>

      {/* 투표 버튼 */}
      {!isPast && match.status !== "cancelled" && (
        <div className="surface-layer rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-[#F4F4F5] mb-4 whitespace-nowrap">
            출석 투표
          </h2>
          <MatchParticipantButtons
            matchId={matchId}
            currentStatus={userParticipant?.status || null}
          />
        </div>
      )}

      {/* 투표자 목록 */}
      <div className="surface-layer rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#F4F4F5] whitespace-nowrap">
            출석 현황 ({totalMembers}명)
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#A1A1AA]">
            <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00C16A]" />
              참석: {goingCount}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
              불참: {notGoingCount}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
              미정: {maybeCount}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <MinusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#71717A]" />
              미투표: {notVotedCount}
            </span>
          </div>
        </div>

        {teamMembersError || participantsError ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <p>출석 정보를 불러오는 중 오류가 발생했습니다.</p>
            <p className="mt-2 text-sm">
              {teamMembersError?.message || participantsError?.message}
            </p>
          </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-2">
            {teamMembers
              .slice()
              .sort((a: any, b: any) => {
                const aHasVoted = participantsByUserId.has(a.user_id);
                const bHasVoted = participantsByUserId.has(b.user_id);
                if (aHasVoted === bHasVoted) {
                  return 0;
                }
                return aHasVoted ? 1 : -1;
              })
              .map((teamMember: any) => {
                const participant = participantsByUserId.get(
                  teamMember.user_id
                );
                const statusKey = participant?.status || "not_voted";
                const statusIcons = {
                  going: <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00C16A]" />,
                  not_going: <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />,
                  maybe: <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />,
                  not_voted: <MinusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#71717A]" />,
                };
                const statusLabels = {
                  going: "참석",
                  not_going: "불참",
                  maybe: "미정",
                  not_voted: "미투표",
                };

                // 프로필에서 이름 가져오기, 없으면 이메일 또는 기본값 사용
                const participantName = profileMap.get(teamMember.user_id);
                const displayName =
                  teamMember.user_id === user.id
                    ? participantName || user.email?.split("@")[0] || "나"
                    : participantName || "이름 없음";

                return (
                <div
                  key={teamMember.user_id}
                  className="flex items-center justify-between gap-2 sm:gap-3 rounded-lg bg-[#192235]/70 p-2.5 sm:p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {statusIcons[statusKey as keyof typeof statusIcons]}
                    </div>
                    <span className="text-sm sm:text-base text-[#F4F4F5] truncate">{displayName}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-[#A1A1AA] whitespace-nowrap flex-shrink-0">
                    {statusLabels[statusKey as keyof typeof statusLabels]}
                  </span>
                </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#A1A1AA]">
            아직 투표자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
