import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { MatchListSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { DeleteTeam } from "./delete-team";
import { TeamCode } from "./team-code";

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

  // 팀의 경기 목록 가져오기 (날짜순 정렬)
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("team_id", teamId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  const isLeader = member.role === "leader";

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/locker-room"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        라커룸으로 돌아가기
      </Link>

      {/* 팀 정보 */}
      <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">
              {team.name}
            </h1>
            {team.description && (
              <p className="text-muted-foreground">{team.description}</p>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              생성일: {new Date(team.created_at).toLocaleDateString("ko-KR")}
            </div>
            
            {/* 팀 코드 표시 */}
            <TeamCode teamId={teamId} />
            
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
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isLeader ? "팀장" : "멤버"}
          </span>
        </div>
      </div>

      {/* 경기 목록 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">경기 일정</h2>
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
              />
            ))}
          </div>
        </Suspense>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
          <p className="text-muted-foreground mb-4">
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
