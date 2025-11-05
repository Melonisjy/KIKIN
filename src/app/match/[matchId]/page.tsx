import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, CheckCircle, XCircle, HelpCircle } from "lucide-react";
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
    redirect("/dashboard");
  }

  // 참여자 목록 가져오기
  const { data: participants, error: participantsError } = await supabase
    .from("match_participants")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  // 현재 사용자의 참여 상태
  const userParticipant = participants?.find(
    (p: any) => p.user_id === user.id
  );

  const matchDate = new Date(`${match.date}T${match.time}`);
  const isPast = matchDate < new Date();

  const statusColors = {
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  // 참여자 통계
  const goingCount = participants?.filter((p: any) => p.status === "going").length || 0;
  const notGoingCount = participants?.filter((p: any) => p.status === "not_going").length || 0;
  const maybeCount = participants?.filter((p: any) => p.status === "maybe").length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href={`/team/${team.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {team.name}으로 돌아가기
      </Link>

      {/* 경기 정보 */}
      <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
              <span className="text-xl font-semibold text-card-foreground">
                {matchDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
              <span className="text-lg text-muted-foreground">
                {match.time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">{match.location}</span>
            </div>
            {match.note && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{match.note}</p>
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
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              statusColors[match.status as keyof typeof statusColors] ||
              statusColors.upcoming
            } ${isPast ? "opacity-50" : ""}`}
          >
            {match.status === "upcoming"
              ? "예정"
              : match.status === "confirmed"
              ? "확정"
              : "취소"}
          </span>
        </div>
      </div>

      {/* 참여 버튼 */}
      {!isPast && match.status !== "cancelled" && (
        <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            참여 여부
          </h2>
          <MatchParticipantButtons
            matchId={matchId}
            currentStatus={userParticipant?.status || null}
          />
        </div>
      )}

      {/* 참여자 목록 */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            참여자 ({participants?.length || 0}명)
          </h2>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              참석: {goingCount}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              불참: {notGoingCount}
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-yellow-600" />
              미정: {maybeCount}
            </span>
          </div>
        </div>

        {participantsError ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <p>참여자 정보를 불러오는 중 오류가 발생했습니다.</p>
            <p className="mt-2 text-sm">{participantsError.message}</p>
          </div>
        ) : participants && participants.length > 0 ? (
          <div className="space-y-2">
            {participants.map((participant: any) => {
              const statusIcons = {
                going: (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ),
                not_going: <XCircle className="h-4 w-4 text-red-600" />,
                maybe: <HelpCircle className="h-4 w-4 text-yellow-600" />,
              };
              const statusLabels = {
                going: "참석",
                not_going: "불참",
                maybe: "미정",
              };

              // user_id의 일부만 표시 (이메일은 나중에 profile 테이블 추가 시 개선 가능)
              const displayName = participant.user_id === user.id 
                ? user.email || "나"
                : `사용자 ${participant.user_id.slice(0, 8)}...`;

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[participant.status as keyof typeof statusIcons]}
                    <span className="text-foreground">
                      {displayName}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {statusLabels[participant.status as keyof typeof statusLabels]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            아직 참여자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

