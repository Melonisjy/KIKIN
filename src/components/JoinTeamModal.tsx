"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinTeamModal({ isOpen, onClose }: JoinTeamModalProps) {
  const [teamCode, setTeamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async () => {
    if (!teamCode.trim()) {
      setError("팀 코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 팀 코드로 팀 찾기 (UUID 형식 가정)
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamCode.trim())
        .single();

      if (teamError || !team) {
        throw new Error("유효하지 않은 팀 코드입니다.");
      }

      // 이미 멤버인지 확인
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        throw new Error("이미 가입한 팀입니다.");
      }

      // 멤버로 추가
      const { error: memberError } = await supabase.from("members").insert({
        user_id: user.id,
        team_id: team.id,
        role: "member",
      });

      if (memberError) {
        throw new Error(`가입 실패: ${memberError.message}`);
      }

      // 성공
      setTeamCode("");
      onClose();
      router.push(`/team/${team.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "팀 가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="팀 코드로 가입하기"
      onConfirm={handleJoin}
      onCancel={onClose}
      confirmText={isLoading ? "가입 중..." : "가입하기"}
      cancelText="취소"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="teamCode"
            className="block text-sm font-medium text-foreground mb-2"
          >
            팀 코드
          </label>
          <input
            type="text"
            id="teamCode"
            value={teamCode}
            onChange={(e) => {
              setTeamCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleJoin();
              }
            }}
            placeholder="팀 코드를 입력하세요"
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            팀장에게 문의하여 팀 코드를 받으세요.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </Modal>
  );
}

