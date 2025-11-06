import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Users, Calendar, Plus, UserPlus, Crown, User } from "lucide-react";
import { TeamCard } from "@/components/TeamCard";
import { TeamListSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LockerRoomActions } from "./locker-room-actions";
import { SetNameModal } from "@/components/SetNameModal";
import { ProfileCard } from "@/components/ProfileCard";

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
    .select("is_premium, name")
    .eq("id", user.id)
    .single();

  // 프로필이 없으면 생성 (첫 로그인 시)
  if (!profile && !profileError) {
    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({ id: user.id });

    if (insertError) {
      console.error("Error creating user profile:", insertError);
    }
  }

  const isPremium = profile?.is_premium || false;
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

  return (
    <>
      {needsName && <SetNameModal isOpen={true} currentName={userName} />}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">라커룸</h1>
              {isPremium && (
                <Link href="/premium">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                </Link>
              )}
            </div>
            <p className="mt-2 text-muted-foreground">
              환영합니다, {userName || user.email}님!
            </p>
          </div>
          {!isPremium && (
            <Link href="/premium">
              <Button variant="outline" size="sm">
                <Crown className="mr-2 h-4 w-4" />
                프리미엄 업그레이드
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-6">
          {/* 프로필 섹션 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground flex items-center gap-2">
              <User className="h-6 w-6" />
              프로필
            </h2>
            <ProfileCard userName={userName} userEmail={user.email || ""} />
          </section>

          {/* 내 팀 섹션 */}
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Users className="h-6 w-6" />내 팀
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <LockerRoomActions />
                <Link href="/team/new">
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />팀 생성
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teams.map((member: any) => {
                    const team = member.teams;
                    if (!team) return null;

                    return (
                      <TeamCard
                        key={team.id}
                        team={team}
                        role={member.role}
                        joinedAt={member.joined_at}
                      />
                    );
                  })}
                </div>
              </Suspense>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  아직 가입한 팀이 없습니다.
                </p>
                <div className="flex flex-col gap-2 items-center sm:flex-row sm:justify-center">
                  <LockerRoomActions />
                  <Link href="/team/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />첫 팀 만들기
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 최근 경기 섹션 (추후 구현) */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              최근 경기
            </h2>
            <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">예정된 경기가 없습니다.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
