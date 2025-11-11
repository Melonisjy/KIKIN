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
        "border border-[#2C354B] bg-[#141824] text-[#F4F4F5] hover:bg-[#2C354B] hover:border-[#00C16A]",
      activeClassName:
        "bg-[#00C16A] text-[#0F1115] border-[#00C16A] hover:bg-[#00A85B]",
    },
    {
      status: "not_going" as const,
      label: "불참",
      icon: XCircle,
      className:
        "border border-[#2C354B] bg-[#141824] text-[#F4F4F5] hover:bg-[#2C354B] hover:border-red-400",
      activeClassName:
        "bg-red-500/20 text-red-400 border-red-400 hover:bg-red-500/30",
    },
    {
      status: "maybe" as const,
      label: "미정",
      icon: HelpCircle,
      className:
        "border border-[#2C354B] bg-[#141824] text-[#F4F4F5] hover:bg-[#2C354B] hover:border-yellow-400",
      activeClassName:
        "bg-yellow-500/20 text-yellow-400 border-yellow-400 hover:bg-yellow-500/30",
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
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
        <div className="text-center text-sm text-[#A1A1AA]">
          저장 중...
        </div>
      )}
    </div>
  );
}

