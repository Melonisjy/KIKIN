"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function NewTeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;

      if (!name || name.trim() === "") {
        setError("팀 이름은 필수입니다.");
        setIsLoading(false);
        return;
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      // 팀 생성
      console.log("Attempting to create team with:", {
        name: name.trim(),
        description: description?.trim() || null,
        created_by: user.id,
      });

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) {
        console.error("Team creation error:", teamError);
        console.error("Error details:", JSON.stringify(teamError, null, 2));
        console.error("User ID:", user.id);
        const errorMessage = teamError.message || teamError.code || "알 수 없는 오류";
        if (teamError.code === "PGRST205") {
          setError(
            "teams 테이블을 찾을 수 없습니다. Supabase SQL Editor에서 'NOTIFY pgrst, \"reload schema\";'를 실행하거나 프로젝트를 재시작해주세요."
          );
        } else if (teamError.code === "42P17") {
          setError(
            "RLS 정책에 무한 재귀 문제가 있습니다. Supabase SQL Editor에서 'supabase/fix_teams_recursion.sql' 파일을 실행해주세요."
          );
        } else {
          setError(`팀 생성 실패: ${errorMessage}`);
        }
        setIsLoading(false);
        return;
      }

      if (!team) {
        setError("팀이 생성되었지만 데이터를 가져올 수 없습니다.");
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
        console.error("Member creation error:", memberError);
        console.error("Error details:", JSON.stringify(memberError, null, 2));
        console.error("Team ID:", team.id);
        console.error("User ID:", user.id);
        
        // 팀은 생성되었지만 멤버 추가 실패 - 팀 삭제 시도
        await supabase.from("teams").delete().eq("id", team.id);
        setError(
          `멤버 추가 실패: ${memberError.message || memberError.code || "알 수 없는 오류"}`
        );
        setIsLoading(false);
        return;
      }

      // 성공 - 팀 상세 페이지로 이동
      router.push(`/team/${team.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "팀 생성 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        대시보드로 돌아가기
      </Link>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-card-foreground mb-6">
          새 팀 만들기
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="mt-2 text-xs text-destructive/80">
                  문제가 계속되면 Supabase RLS 정책을 확인하거나 브라우저 콘솔을 확인하세요.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              팀 이름 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="예: 우리팀"
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              설명
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="팀에 대한 간단한 설명을 입력하세요"
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "생성 중..." : "팀 생성"}
            </Button>
            <Link href="/dashboard">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
