"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteTeamProps {
  teamId: string;
  teamName: string;
  isLeader: boolean;
}

export function DeleteTeam({ teamId, teamName, isLeader }: DeleteTeamProps) {
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
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member || member.role !== "leader") {
        throw new Error("팀장만 팀을 삭제할 수 있습니다.");
      }

      // 팀 삭제 (CASCADE로 멤버와 경기도 자동 삭제됨)
      const { error: deleteError } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (deleteError) {
        throw new Error(`팀 삭제 실패: ${deleteError.message}`);
      }

      // 성공
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "팀 삭제 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="mt-4"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        팀 삭제
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isLoading) {
            setIsOpen(false);
            setError(null);
          }
        }}
        title="팀 삭제"
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
            정말로 <strong>{teamName}</strong> 팀을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없으며, 팀의 모든 경기와 멤버 정보가 함께 삭제됩니다.
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

