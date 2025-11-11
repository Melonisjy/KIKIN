import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { notifyMatchCreatedServer } from "@/lib/notifications-server";
import { OnboardingGuide } from "@/components/OnboardingGuide";

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

      // 팀원들에게 알림 생성
      const { data: members } = await supabase
        .from("members")
        .select("user_id")
        .eq("team_id", teamId);

      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      if (members && team) {
        const memberIds = members.map((m: any) => m.user_id);
        // 비동기로 알림 생성 (실패해도 경기 생성은 성공)
        notifyMatchCreatedServer(memberIds, date, team.name, match.id).catch(
          () => {
            // 알림 생성 실패는 무시
          }
        );
      }

      redirect(`/match/${match.id}`);
    } catch (error) {
      // 에러는 상위로 전파
      throw error;
    }
  }

  // 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split("T")[0];
  // 현재 시간을 기본값으로 설정 (HH:MM 형식)
  const now = new Date().toTimeString().slice(0, 5);

  const onboardingSteps = [
    {
      id: "set-date-time",
      title: "킥오프 시간 확정",
      description:
        "날짜와 시간을 먼저 확정하면 팀원들이 준비 시간과 이동을 미리 조율할 수 있어요.",
    },
    {
      id: "confirm-location",
      title: "구장 체크",
      description:
        "풋살장 이름이나 주소를 정확히 입력해 팀원들이 헤매지 않도록 안내하세요.",
    },
    {
      id: "share-note",
      title: "브리핑 메모 작성",
      description:
        "복장, 포메이션, 회비 등 꼭 전달할 정보를 메모에 남기면 라인업이 흔들리지 않아요.",
    },
    {
      id: "send-notification",
      title: "알림으로 라인업 호출",
      description:
        "매치를 편성하면 팀원에게 알림이 즉시 전달되고, 출석 투표가 자동으로 시작됩니다.",
    },
  ];

  return (
    <>
      <OnboardingGuide
        storageKey={`match-new-${teamId}`}
        title="매치 편성 체크"
        subtitle="필수 정보를 채우고 라커룸에 킥오프 신호를 보내세요."
        accentLabel="경기 편성 온보딩"
        steps={onboardingSteps}
      />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href={`/team/${teamId}`}
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {team.name}으로 돌아가기
      </Link>

      <div className="surface-layer rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">
          새 매치 편성
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
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
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
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
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
              placeholder="예: 킥-인 아레나"
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] placeholder:text-[#96A3C4] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
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
              placeholder="복장, 전술 노트, 회비 등 브리핑이 있다면 적어주세요"
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] placeholder:text-[#96A3C4] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              매치 편성
            </Button>
            <Link href={`/team/${teamId}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                라인업으로
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
    </>
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
