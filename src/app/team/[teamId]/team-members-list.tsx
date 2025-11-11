"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { RemoveMember } from "./remove-member";

interface TeamMember {
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamMembersListProps {
  members: TeamMember[];
  memberProfileMap: Map<string, string | null>;
  currentUserId: string;
  isLeader: boolean;
  totalMembers: number;
  membersError: any;
  teamId: string;
}

export function TeamMembersList({
  members,
  memberProfileMap,
  currentUserId,
  isLeader,
  totalMembers,
  membersError,
  teamId,
}: TeamMembersListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 6;
  const displayMembers = showAll ? members : members.slice(0, displayLimit);
  const hasMore = members.length > displayLimit;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F4F4F5]">팀원</h3>
        <span className="text-xs text-[#71717A]">{totalMembers}명</span>
      </div>
      {membersError ? (
        <div className="text-xs text-red-400 py-2">
          팀원 정보를 불러올 수 없습니다.
        </div>
      ) : members && members.length > 0 ? (
        <div className="space-y-1.5">
          {displayMembers.map((memberItem) => {
            const memberName =
              memberProfileMap.get(memberItem.user_id) || null;
            const isMemberLeader = memberItem.role === "leader";
            const isCurrentUser = memberItem.user_id === currentUserId;

            return (
              <div
                key={memberItem.user_id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C16A]/15 text-[#00E693] text-xs font-semibold shrink-0">
                    {memberName
                      ? memberName.charAt(0).toUpperCase()
                      : memberItem.user_id.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-[#F4F4F5] truncate">
                        {memberName || "이름 없음"}
                      </span>
                      {isMemberLeader && (
                        <span className="text-xs px-1 py-0.5 rounded bg-[#00C16A]/20 text-[#00C16A]">
                          팀장
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs text-[#71717A]">(나)</span>
                      )}
                    </div>
                  </div>
                </div>
                {isLeader && !isCurrentUser && (
                  <RemoveMember
                    teamId={teamId}
                    memberId={memberItem.user_id}
                    memberName={memberName}
                    isLeader={isLeader}
                  />
                )}
              </div>
            );
          })}
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-1 transition-colors cursor-pointer"
            >
              +{members.length - displayLimit}명 더
            </button>
          )}
          {showAll && hasMore && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-1 transition-colors cursor-pointer"
            >
              접기
            </button>
          )}
        </div>
      ) : (
        <div className="text-xs text-[#71717A] py-4 text-center border border-dashed border-[var(--border-soft)] rounded-lg">
          팀원이 없습니다.
        </div>
      )}
    </section>
  );
}

