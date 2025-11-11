"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import { getUserFriendlyMessage, normalizeError } from "@/lib/api-client";

export default function NewTeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;

      if (!name || name.trim() === "") {
        toast.error("팀 이름은 필수입니다.");
        setIsLoading(false);
        return;
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      // 팀 생성
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError || !team) {
        toast.error(
          getUserFriendlyMessage(normalizeError(teamError)) || "팀 생성에 실패했습니다."
        );
        setIsLoading(false);
        return;
      }

      // 팀장으로 멤버 추가
      const { error: memberError } = await supabase
        .from("members")
        .insert({
          user_id: user.id,
          team_id: team.id,
          role: "leader",
        });

      if (memberError) {
        // 팀은 생성되었지만 멤버 추가 실패 - 팀 삭제 시도
        await supabase.from("teams").delete().eq("id", team.id);
        toast.error(
          getUserFriendlyMessage(normalizeError(memberError)) || "멤버 추가에 실패했습니다."
        );
        setIsLoading(false);
        return;
      }

      // 성공
      toast.success("팀 킥오프가 완료되었습니다!");
      router.push(`/team/${team.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error("예상치 못한 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/locker-room"
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        라커룸으로 돌아가기
      </Link>

      <div className="surface-layer rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">
          새 팀 킥오프
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              팀 이름 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="예: 킥오프 FC"
              disabled={isLoading}
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] placeholder:text-[#96A3C4] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              팀 소개
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="팀 분위기나 전술 노트를 간단히 적어주세요"
              disabled={isLoading}
              aria-label="팀 설명"
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-[#F4F4F5] placeholder:text-[#96A3C4] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] resize-none disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "킥오프 준비 중..." : "팀 킥오프"}
            </Button>
            <Link href="/locker-room">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                라커룸으로
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
