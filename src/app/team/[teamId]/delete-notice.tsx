"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteNoticeProps {
  noticeId: string;
  noticeTitle: string;
  isLeader: boolean;
}

export function DeleteNotice({
  noticeId,
  noticeTitle,
  isLeader,
}: DeleteNoticeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isLeader) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("공지를 삭제하시겠습니까?")) {
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

      // 팀장 권한 확인
      const { data: notice } = await supabase
        .from("team_notices")
        .select("team_id, created_by")
        .eq("id", noticeId)
        .single();

      if (!notice) {
        throw new Error("공지를 찾을 수 없습니다.");
      }

      if (notice.created_by !== user.id) {
        throw new Error("본인이 작성한 공지만 삭제할 수 있습니다.");
      }

      // 공지 삭제
      const { error: deleteError } = await supabase
        .from("team_notices")
        .delete()
        .eq("id", noticeId);

      if (deleteError) {
        throw new Error(`공지 삭제 실패: ${deleteError.message}`);
      }

      // 성공
      router.refresh();
    } catch (err: any) {
      setError(err.message || "공지 삭제 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isLoading}
        className="text-[#A1A1AA] hover:text-destructive"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

