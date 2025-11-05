"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteMatchProps {
  matchId: string;
  matchDate: string;
  isLeader: boolean;
}

export function DeleteMatch({
  matchId,
  matchDate,
  isLeader,
}: DeleteMatchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isLeader) {
    return null;
  }

  const handleDelete = async () => {
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
      const { data: match } = await supabase
        .from("matches")
        .select("team_id, teams!inner(created_by)")
        .eq("id", matchId)
        .single();

      if (!match) {
        throw new Error("경기를 찾을 수 없습니다.");
      }

      const team = match.teams as any;
      if (team.created_by !== user.id) {
        // 팀장인지 확인 (members 테이블에서)
        const { data: member } = await supabase
          .from("members")
          .select("role")
          .eq("team_id", match.team_id)
          .eq("user_id", user.id)
          .single();

        if (!member || member.role !== "leader") {
          throw new Error("팀장만 경기를 삭제할 수 있습니다.");
        }
      }

      // 경기 삭제 (CASCADE로 참가자도 자동 삭제됨)
      const { error: deleteError } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (deleteError) {
        throw new Error(`경기 삭제 실패: ${deleteError.message}`);
      }

      // 성공 - 팀 페이지로 이동
      router.push(`/team/${match.team_id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "경기 삭제 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const formattedDate = new Date(matchDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        경기 삭제
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isLoading) {
            setIsOpen(false);
            setError(null);
          }
        }}
        title="경기 삭제"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsOpen(false);
          setError(null);
        }}
        confirmText={isLoading ? "삭제 중..." : "삭제"}
        cancelText="취소"
        variant="danger"
      >
        <div>
          <p className="text-muted-foreground mb-4">
            정말로 <strong>{formattedDate}</strong> 경기를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없으며, 경기의 모든 참가 정보가 함께 삭제됩니다.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
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
    </>
  );
}

