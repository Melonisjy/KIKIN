"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  notifyRequestApproved,
  notifyRequestRejected,
} from "@/lib/notifications";

interface ApproveRequestProps {
  requestId: string;
  userId: string;
  teamId: string;
  isLeader: boolean;
}

export function ApproveRequest({
  requestId,
  userId,
  teamId,
  isLeader,
}: ApproveRequestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isLeader) {
    return null;
  }

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 팀장 권한 확인
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member || member.role !== "leader") {
        throw new Error("팀장만 가입 요청을 승인할 수 있습니다.");
      }

      // 멤버로 추가
      const { error: memberError } = await supabase.from("members").insert({
        user_id: userId,
        team_id: teamId,
        role: "member",
      });

      if (memberError) {
        throw new Error(`승인 실패: ${memberError.message}`);
      }

      // 가입 요청 삭제
      const { error: deleteError } = await supabase
        .from("team_requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) {
        // 멤버는 추가되었으므로 계속 진행
        // 에러는 무시 (이미 멤버 추가는 성공)
      }

      // 팀 이름 가져오기
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      // 알림 생성
      if (team) {
        await notifyRequestApproved(userId, team.name, teamId);
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "승인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 팀장 권한 확인
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member || member.role !== "leader") {
        throw new Error("팀장만 가입 요청을 거절할 수 있습니다.");
      }

      // 가입 요청 삭제
      const { error: deleteError } = await supabase
        .from("team_requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) {
        throw new Error(`거절 실패: ${deleteError.message}`);
      }

      // 팀 이름 가져오기
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      // 알림 생성
      if (team) {
        await notifyRequestRejected(userId, team.name, teamId);
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "거절 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <Button
        onClick={handleApprove}
        disabled={isLoading}
        size="icon-sm"
        className="min-w-[44px] min-h-[44px]"
        type="button"
        aria-label="승인"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleReject}
        disabled={isLoading}
        size="icon-sm"
        variant="outline"
        className="min-w-[44px] min-h-[44px]"
        type="button"
        aria-label="거절"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

