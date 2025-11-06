import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ teamId?: string }>;
}

async function NewMatchForm({ teamId }: { teamId: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 팀 정보 및 사용자가 팀장인지 확인
  const { data: member } = await supabase
    .from("members")
    .select("role, teams(*)")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "leader") {
    redirect(`/team/${teamId}`);
  }

  const team = member.teams as any;

  // Check premium status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium || false;

  // Check match limit for free users
  if (!isPremium) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .gte("created_at", startOfWeek.toISOString());

    if (count && count >= 2) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link
            href={`/team/${teamId}`}
            className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {team.name}으로 돌아가기
          </Link>

          <div className="rounded-lg border border-[#27272A] bg-[#181A1F] p-8 text-center">
            <Crown className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold text-[#F4F4F5] mb-4">
              무료 플랜 제한 도달
            </h2>
            <p className="text-[#A1A1AA] mb-6">
              무료 플랜에서는 주당 2경기까지만 생성할 수 있습니다.
              <br />
              프리미엄으로 업그레이드하여 무제한 경기를 생성하세요!
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/premium">
                <Button>
                  <Crown className="mr-2 h-4 w-4" />
                  프리미엄으로 업그레이드
                </Button>
              </Link>
              <Link href={`/team/${teamId}`}>
                <Button variant="outline">돌아가기</Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  async function createMatch(formData: FormData) {
    "use server";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
      }

      const teamId = formData.get("teamId") as string;
      const date = formData.get("date") as string;
      const time = formData.get("time") as string;
      const location = formData.get("location") as string;
      const note = formData.get("note") as string;

      // 팀장 권한 확인
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member || member.role !== "leader") {
        throw new Error("팀장만 경기를 생성할 수 있습니다.");
      }

      // Premium check
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      const isPremium = profile?.is_premium || false;

      // Check match limit for free users
      if (!isPremium) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId)
          .gte("created_at", startOfWeek.toISOString());

        if (count && count >= 2) {
          throw new Error(
            "무료 플랜에서는 주당 2경기까지만 생성할 수 있습니다. 프리미엄으로 업그레이드하세요."
          );
        }
      }

      if (!date || !time || !location) {
        throw new Error("날짜, 시간, 장소는 필수입니다.");
      }

      const { data: match, error } = await supabase
        .from("matches")
        .insert({
          team_id: teamId,
          date,
          time,
          location: location.trim(),
          note: note?.trim() || null,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) {
        throw new Error(`경기 생성 실패: ${error.message}`);
      }

      redirect(`/match/${match.id}`);
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  }

  // 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split("T")[0];
  // 현재 시간을 기본값으로 설정 (HH:MM 형식)
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href={`/team/${teamId}`}
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {team.name}으로 돌아가기
      </Link>

      {!isPremium && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p>
            무료 플랜: 주당 2경기까지 생성 가능.{" "}
            <Link href="/premium" className="underline font-medium">
              프리미엄으로 업그레이드
            </Link>
            하면 무제한 경기를 생성할 수 있습니다.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-[#27272A] bg-[#181A1F] p-6">
        <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">
          새 경기 만들기
        </h1>

        <form action={createMatch} className="space-y-6">
          <input type="hidden" name="teamId" value={teamId} />

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              날짜 <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              defaultValue={today}
              min={today}
              className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
            />
          </div>

          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              시간 <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
              defaultValue={now}
              className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              장소 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              placeholder="예: 서울 풋살장"
              className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
            />
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              메모
            </label>
            <textarea
              id="note"
              name="note"
              rows={4}
              placeholder="추가 정보나 안내사항을 입력하세요"
              className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              경기 생성
            </button>
            <Link
              href={`/team/${teamId}`}
              className="flex-1 rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-center font-medium text-[#F4F4F5] transition-colors hover:bg-[#27272A] hover:text-[#F4F4F5] cursor-pointer"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default async function NewMatchPage({
  searchParams,
}: PageProps) {
  const { teamId } = await searchParams;

  if (!teamId) {
    redirect("/locker-room");
  }

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <NewMatchForm teamId={teamId} />
    </Suspense>
  );
}
