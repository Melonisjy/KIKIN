"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  status: string;
}

interface MatchesListProps {
  matches: Match[];
  matchesError: any;
  matchParticipantStats: Record<string, { going: number; notGoing: number; maybe: number }>;
  isLeader: boolean;
  teamId: string;
}

export function MatchesList({
  matches,
  matchesError,
  matchParticipantStats,
  isLeader,
  teamId,
}: MatchesListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 6;
  const displayMatches = showAll ? matches : matches.slice(0, displayLimit);
  const hasMore = matches.length > displayLimit;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F4F4F5]">경기 일정</h2>
        {isLeader && (
          <Link href={`/match/new?teamId=${teamId}`}>
            <Button size="sm" variant="ghost" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              추가
            </Button>
          </Link>
        )}
      </div>

      {matchesError ? (
        <div className="text-sm text-red-400 py-4">
          경기 정보를 불러올 수 없습니다.
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-1.5">
          {displayMatches.map((match) => {
            const matchDate = new Date(`${match.date}T${match.time}`);
            const isPast = matchDate < new Date();
            const formattedDate = matchDate.toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              weekday: "short",
            });
            const stats = matchParticipantStats[match.id];

            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#F4F4F5]">
                      {formattedDate} {match.time.slice(0, 5)}
                    </span>
                    {isPast ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[#71717A]">
                        종료
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        {match.status === "confirmed" ? "확정" : "예정"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
                    <span>{match.location}</span>
                    {stats && (
                      <>
                        <span className="text-[#71717A]">·</span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-[#00C16A]" />
                          {stats.going}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <XCircle className="h-3 w-3 text-red-400" />
                          {stats.notGoing}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="h-3 w-3 text-yellow-400" />
                          {stats.maybe}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {hasMore && !showAll && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowAll(true);
              }}
              className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-2 transition-colors cursor-pointer"
            >
              +{matches.length - displayLimit}개 더
            </button>
          )}
          {showAll && hasMore && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowAll(false);
              }}
              className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-2 transition-colors cursor-pointer"
            >
              접기
            </button>
          )}
        </div>
      ) : (
        <div className="text-sm text-[#A1A1AA] py-8 text-center border border-dashed border-[var(--border-soft)] rounded-lg">
          예정된 경기가 없습니다.
        </div>
      )}
    </section>
  );
}

