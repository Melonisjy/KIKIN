"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/Toast";
import { getUserFriendlyMessage, normalizeError } from "@/lib/api-client";
import { notifyTeamRequest } from "@/lib/notifications";

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

      // 이미 가입 요청이 있는지 확인
      const { data: existingRequest } = await supabase
        .from("team_requests")
        .select("id, status")
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          throw new Error("이미 가입 요청이 대기 중입니다.");
        } else if (existingRequest.status === "approved") {
          throw new Error("이미 가입한 팀입니다.");
        }
      }

      // 가입 요청 생성
      const { error: requestError } = await supabase
        .from("team_requests")
        .insert({
          user_id: user.id,
          team_id: team.id,
          status: "pending",
        });

      if (requestError) {
        throw new Error(
          getUserFriendlyMessage(normalizeError(requestError)) ||
            "가입 요청에 실패했습니다."
        );
      }

      // 팀장 정보 가져오기
      const { data: leader } = await supabase
        .from("members")
        .select("user_id")
        .eq("team_id", team.id)
        .eq("role", "leader")
        .single();

      // 사용자 이름 가져오기 (없으면 이메일 사용)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      const requesterName =
        profile?.name || user.email?.split("@")[0] || "사용자";

      // 알림 생성 (팀장에게)
      if (leader) {
        const result = await notifyTeamRequest(
          leader.user_id,
          requesterName,
          team.id
        );
        if (!result.success && process.env.NODE_ENV === "development") {
          // 알림 생성 실패해도 가입 요청은 성공이므로 개발 환경에서만 로그
          console.error("알림 생성 실패:", result.error);
        }
      }

      // 성공
      setTeamCode("");
      onClose();
      toast.success("가입 요청이 전송되었습니다. 팀장의 승인을 기다려주세요.");
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
      confirmText={isLoading ? "가입 중..." : "요청하기"}
      cancelText="취소"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="teamCode"
            className="block text-sm font-medium text-[#F4F4F5] mb-2"
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
            className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] transition-colors"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#A1A1AA]" />
          </div>
        )}
      </div>
    </Modal>
  );
}
