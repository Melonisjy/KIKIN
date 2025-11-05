"use client";

import { useState } from "react";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ParticipantButtonsProps {
  matchId: string;
  currentStatus: "going" | "not_going" | "maybe" | null;
}

export function MatchParticipantButtons({
  matchId,
  currentStatus,
}: ParticipantButtonsProps) {
  const [status, setStatus] = useState<
    "going" | "not_going" | "maybe" | null
  >(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleStatusChange = async (
    newStatus: "going" | "not_going" | "maybe"
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 기존 참여 기록 확인
      const { data: existing } = await supabase
        .from("match_participants")
        .select("id")
        .eq("match_id", matchId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // 업데이트
        const { error: updateError } = await supabase
          .from("match_participants")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        // 새로 생성
        const { error: insertError } = await supabase
          .from("match_participants")
          .insert({
            match_id: matchId,
            user_id: user.id,
            status: newStatus,
          });

        if (insertError) throw insertError;
      }

      setStatus(newStatus);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
      console.error("Error updating participation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const buttons = [
    {
      status: "going" as const,
      label: "참석",
      icon: CheckCircle,
      className:
        "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200",
      activeClassName:
        "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700",
    },
    {
      status: "not_going" as const,
      label: "불참",
      icon: XCircle,
      className:
        "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200",
      activeClassName:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700",
    },
    {
      status: "maybe" as const,
      label: "미정",
      icon: HelpCircle,
      className:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200",
      activeClassName:
        "bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-700",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {buttons.map(({ status: btnStatus, label, icon: Icon, className, activeClassName }) => {
          const isActive = status === btnStatus;
          return (
            <button
              key={btnStatus}
              onClick={() => handleStatusChange(btnStatus)}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive ? activeClassName : className
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          저장 중...
        </div>
      )}
    </div>
  );
}

