"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { notifyMemberRemoved } from "@/lib/notifications";

interface RemoveMemberProps {
  teamId: string;
  memberId: string;
  memberName: string | null;
  isLeader: boolean;
}

export function RemoveMember({
  teamId,
  memberId,
  memberName,
  isLeader,
}: RemoveMemberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isLeader) {
    return null;
  }

  const handleRemove = async () => {
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
        throw new Error("팀장만 팀원을 방출할 수 있습니다.");
      }

      // 팀 이름 가져오기
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      // 팀원 방출 (members 테이블에서 삭제)
      const { error: deleteError } = await supabase
        .from("members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", memberId);

      if (deleteError) {
        throw new Error(`팀원 방출 실패: ${deleteError.message}`);
      }

      // 알림 생성 (방출된 팀원에게)
      if (team) {
        const result = await notifyMemberRemoved(memberId, team.name, teamId);
        if (!result.success && process.env.NODE_ENV === "development") {
          // 알림 생성 실패해도 방출은 성공이므로 개발 환경에서만 로그
          // 에러는 무시 (방출은 성공)
        }
      }

      // 성공
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "팀원 방출 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="min-w-[44px] min-h-[44px] p-2 rounded hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors touch-manipulation active:scale-[0.95] flex items-center justify-center"
        type="button"
        title="팀원 방출"
        aria-label="팀원 방출"
      >
        <X className="h-4 w-4" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError(null);
        }}
        title="팀원 방출"
        onConfirm={handleRemove}
        onCancel={() => {
          setIsOpen(false);
          setError(null);
        }}
        confirmText={isLoading ? "방출 중..." : "방출하기"}
        cancelText="취소"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-[#F4F4F5]">
            <span className="font-medium">{memberName || "이 팀원"}</span>을(를)
            팀에서 방출하시겠습니까?
          </p>
          <p className="text-sm text-[#A1A1AA]">
            이 작업은 되돌릴 수 없습니다. 방출된 팀원은 다시 팀 코드로 가입할 수
            있습니다.
          </p>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
