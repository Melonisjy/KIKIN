import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Users, Calendar, Plus, UserPlus, User } from "lucide-react";
import { TeamCard } from "@/components/TeamCard";
import { TeamListSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LockerRoomActions } from "./locker-room-actions";
import { SetNameModal } from "@/components/SetNameModal";
import { ProfileCard } from "@/components/ProfileCard";
import { MatchCard } from "@/components/MatchCard";
import { OnboardingGuide } from "@/components/OnboardingGuide";

export default async function LockerRoomPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with name (no cache to ensure fresh data)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // 프로필이 없으면 생성 (첫 로그인 시)
  if (!profile && !profileError) {
    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({ id: user.id });

    if (insertError) {
      // 프로필 생성 실패는 무시 (다음 요청에서 재시도)
    }
  }

  const userName = profile?.name;
  const needsName = !userName || userName.trim() === "";

  // 사용자가 가입한 팀들 가져오기
  const { data: teams, error: teamsError } = await supabase
    .from("members")
    .select(
      `
      id,
      role,
      joined_at,
      teams (
        id,
        name,
        description,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  // 각 팀의 멤버 수 계산
  const teamIds =
    teams?.map((member: any) => member.teams?.id).filter(Boolean) || [];
  let memberCountMap = new Map<string, number>();
  let leaderNameMap = new Map<string, string | null>();

  if (teamIds.length > 0) {
    // 각 팀의 멤버 수를 가져오기
    const { data: memberCounts } = await supabase
      .from("members")
      .select("team_id")
      .in("team_id", teamIds);

    // 팀별로 멤버 수 계산
    memberCounts?.forEach((member: any) => {
      const currentCount = memberCountMap.get(member.team_id) || 0;
      memberCountMap.set(member.team_id, currentCount + 1);
    });

    // 각 팀의 팀장 정보 가져오기
    const { data: leaders } = await supabase
      .from("members")
      .select("team_id, user_id")
      .in("team_id", teamIds)
      .eq("role", "leader");

    if (leaders && leaders.length > 0) {
      const leaderUserIds = leaders.map((l: any) => l.user_id);
      const { data: leaderProfiles } = await supabase
        .from("user_profiles")
        .select("id, name")
        .in("id", leaderUserIds);

      // 팀장 이름 맵 생성
      leaders.forEach((leader: any) => {
        const profile = leaderProfiles?.find((p: any) => p.id === leader.user_id);
        leaderNameMap.set(leader.team_id, profile?.name || null);
      });
    }
  }

  // 사용자가 가입한 모든 팀의 최근 경기 가져오기 (과거 경기 포함)
  let recentMatches: any[] = [];
  let matchesError = null;
  let teamNameMap = new Map<string, string>();
let matchParticipantStats: Record<
  string,
  { going: number; notGoing: number; maybe: number }
> = {};
const voteReminderMap: Record<string, { message: string }> = {};

  if (teamIds.length > 0) {
    // 팀 이름 맵 생성
    teams?.forEach((member: any) => {
      if (member.teams?.id) {
        teamNameMap.set(member.teams.id, member.teams.name);
      }
    });

    // 모든 경기 가져오기 (과거 경기 포함, 취소된 경기도 포함)
    const { data: matches, error: matchesErr } = await supabase
      .from("matches")
      .select("*")
      .in("team_id", teamIds)
      .order("date", { ascending: false }) // 최근 경기 먼저
      .order("time", { ascending: false })
      .limit(10); // 최대 10개까지만 표시

    if (matchesErr) {
      matchesError = matchesErr;
    } else {
      recentMatches = matches || [];

      // 각 경기의 참여자 통계 가져오기
      if (recentMatches.length > 0) {
        const matchIds = recentMatches.map((m: any) => m.id);
        const { data: participants } = await supabase
          .from("match_participants")
          .select("match_id, user_id, status")
          .in("match_id", matchIds);

        const now = new Date();
        const REMINDER_THRESHOLD_HOURS = 18;

        // 각 경기별로 통계 계산
        matchIds.forEach((matchId: string) => {
          const matchParticipants =
            participants?.filter((p: any) => p.match_id === matchId) || [];
          matchParticipantStats[matchId] = {
            going: matchParticipants.filter((p: any) => p.status === "going")
              .length,
            notGoing: matchParticipants.filter(
              (p: any) => p.status === "not_going"
            ).length,
            maybe: matchParticipants.filter((p: any) => p.status === "maybe")
              .length,
          };

          const match = recentMatches.find((m: any) => m.id === matchId);
          if (!match) return;

          const userResponded = matchParticipants.some(
            (participant: any) => participant.user_id === user.id
          );

          if (userResponded || match.status === "cancelled") {
            return;
          }

          const matchDateTime = new Date(`${match.date}T${match.time || "00:00"}`);
          if (Number.isNaN(matchDateTime.getTime())) {
            return;
          }

          const diffMs = matchDateTime.getTime() - now.getTime();
          if (diffMs <= 0) {
            return;
          }

          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours > REMINDER_THRESHOLD_HOURS) {
            return;
          }

          const roundedHours = Math.max(1, Math.round(diffHours));
          const message =
            roundedHours <= 1
              ? "투표 마감 직전! 출석을 남겨주세요."
              : `${roundedHours}시간 후 킥오프 · 투표 필요`;

          voteReminderMap[matchId] = { message };
        });
      }
    }
  }

  return (
    <>
      {needsName && <SetNameModal isOpen={true} currentName={userName} />}
      <OnboardingGuide
        storageKey="locker-room"
        title="라커룸 킥오프 체크"
        subtitle="팀 라인업과 매치 준비를 위한 필수 흐름을 살펴보세요."
        accentLabel="라커룸 온보딩"
        steps={[
          {
            id: "profile-name",
            title: "선수 카드 정비",
            description:
              "선수 카드에 이름을 등록하면 팀원들이 라커룸에서 당신을 더 빠르게 찾을 수 있어요.",
          },
          {
            id: "create-team",
            title: "팀 킥오프 또는 합류",
            description:
              "우측 상단 버튼으로 팀을 킥오프하거나, 팀 코드로 빠르게 합류하세요.",
          },
          {
            id: "invite-members",
            title: "라인업 초대",
            description:
              "팀 상세 페이지에서 팀 코드를 복사해 팀원들에게 전송하면 라인업을 빠르게 채울 수 있어요.",
          },
          {
            id: "review-matches",
            title: "최근 경기 브리핑 확인",
            description:
              "아래 ‘최근 경기 브리핑’에서 킥오프 예정 경기와 출석 현황을 한눈에 확인하세요.",
          },
        ]}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F4F4F5]">라커룸</h1>
          <p className="mt-2 text-[#A1A1AA]">
            {userName || user.email} 선수, 라인업 정비가 완료되면 곧 킥오프입니다.
          </p>
        </div>

        <div className="space-y-6">
          {/* 프로필 섹션 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-[#F4F4F5] flex items-center gap-2">
              <User className="h-6 w-6" />
              선수 카드
            </h2>
            <ProfileCard userName={userName} userEmail={user.email || ""} />
          </section>

          {/* 내 팀 섹션 */}
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-[#F4F4F5] flex items-center gap-2">
                <Users className="h-6 w-6" />
                나의 라인업
                {teams && teams.length > 0 && (
                  <span className="text-lg font-medium text-[#A1A1AA] ml-2">
                    ({teams.length})
                  </span>
                )}
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <LockerRoomActions />
                <Link href="/team/new">
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    팀 킥오프
                  </Button>
                </Link>
              </div>
            </div>

            {teamsError ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                <p>팀 정보를 불러오는 중 오류가 발생했습니다.</p>
                <p className="mt-2 text-sm">{teamsError.message}</p>
              </div>
            ) : teams && teams.length > 0 ? (
              <Suspense fallback={<TeamListSkeleton />}>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((member: any) => {
                    const team = member.teams;
                    if (!team) return null;

                    const memberCount = memberCountMap.get(team.id) || 0;
                    const leaderName = leaderNameMap.get(team.id) || null;

                    return (
                      <TeamCard
                        key={team.id}
                        team={team}
                        role={member.role}
                        joinedAt={member.joined_at}
                        memberCount={memberCount}
                        leaderName={leaderName}
                      />
                    );
                  })}
                </div>
              </Suspense>
            ) : (
              <div className="rounded-lg border border-dashed border-[#2C354B] bg-[#1A2333]/65 p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-[#A1A1AA] mb-4" />
                <p className="text-[#A1A1AA] mb-4">
                  아직 합류한 팀이 없어요. 첫 라인업을 꾸려볼까요?
                </p>
                <div className="flex flex-col gap-2 items-center sm:flex-row sm:justify-center">
                  <LockerRoomActions />
                  <Link href="/team/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      첫 팀 킥오프
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 최근 경기 섹션 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-[#F4F4F5] flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              최근 경기 브리핑
              {recentMatches.length > 0 && (
                <span className="text-lg font-medium text-[#A1A1AA] ml-2">
                  ({recentMatches.length})
                </span>
              )}
            </h2>

            {matchesError ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                <p>경기 정보를 불러오는 중 오류가 발생했습니다.</p>
                <p className="mt-2 text-sm">{matchesError.message}</p>
              </div>
            ) : recentMatches.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {recentMatches.map((match: any) => {
                  const teamName =
                    teamNameMap.get(match.team_id) || "알 수 없는 팀";
                  return (
                    <MatchCard
                      key={match.id}
                      match={{
                        id: match.id,
                        date: match.date,
                        time: match.time,
                        location: match.location,
                        note: match.note,
                        status: match.status,
                      }}
                      showTeam={true}
                      teamName={teamName}
                      participantStats={matchParticipantStats[match.id]}
                      voteReminder={voteReminderMap[match.id] || null}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#2C354B] bg-[#1A2333]/65 p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-[#A1A1AA] mb-4" />
                <p className="text-[#A1A1AA]">
                  예정된 경기가 없어요. 새로운 매치를 편성해 라커룸을 달궈보세요.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
