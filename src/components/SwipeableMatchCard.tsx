"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { MatchCard } from "./MatchCard";
import { SwipeableCard } from "./SwipeableCard";
import { BottomSheet } from "./BottomSheet";
import { MatchParticipantButtons } from "@/app/match/[matchId]/participant-buttons";

interface SwipeableMatchCardProps {
  match: {
    id: string;
    date: string;
    time: string;
    location: string;
    note?: string | null;
    status: "upcoming" | "confirmed" | "cancelled";
  };
  showTeam?: boolean;
  teamName?: string;
  participantStats?: {
    going: number;
    notGoing: number;
    maybe: number;
  };
  voteReminder?: {
    message: string;
  } | null;
  currentStatus?: "going" | "not_going" | "maybe" | null;
  isLeader?: boolean;
  onDelete?: () => void;
}

export function SwipeableMatchCard({
  match,
  showTeam,
  teamName,
  participantStats,
  voteReminder,
  currentStatus,
  isLeader,
  onDelete,
}: SwipeableMatchCardProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const router = useRouter();
  const matchDate = new Date(`${match.date}T${match.time}`);
  const isPast = matchDate < new Date();
  const canVote = !isPast && match.status !== "cancelled";

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
    // 투표 후 페이지 새로고침
    setTimeout(() => {
      router.refresh();
    }, 300);
  };

  const rightActions = canVote
    ? [
        {
          label: "투표",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-[#0F1115]",
          bgColor: "bg-[#00C16A]",
          onAction: () => setIsBottomSheetOpen(true),
        },
      ]
    : [];

  const leftActions =
    isLeader && !isPast && match.status !== "cancelled" && onDelete
      ? [
          {
            label: "삭제",
            icon: <Trash2 className="h-5 w-5" />,
            color: "text-white",
            bgColor: "bg-red-500",
            onAction: onDelete,
          },
        ]
      : [];

  return (
    <>
      <SwipeableCard
        leftActions={leftActions}
        rightActions={rightActions}
        disabled={!canVote && leftActions.length === 0}
      >
        <MatchCard
          match={match}
          showTeam={showTeam}
          teamName={teamName}
          participantStats={participantStats}
          voteReminder={voteReminder}
        />
      </SwipeableCard>

      {/* Bottom Sheet for Voting - 모바일 */}
      {canVote && (
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={handleCloseBottomSheet}
          title="출석 투표"
        >
          <div className="p-4">
            <MatchParticipantButtons
              matchId={match.id}
              currentStatus={currentStatus || null}
            />
          </div>
        </BottomSheet>
      )}
    </>
  );
}

