"use client";

import { useState } from "react";
import { ApproveRequest } from "./approve-request";

interface JoinRequest {
  id: string;
  user_id: string;
  created_at: string;
}

interface JoinRequestsListProps {
  requests: JoinRequest[];
  requestProfileMap: Map<string, string | null>;
  isLeader: boolean;
  teamId: string;
  requestsError: any;
  pendingRequestsCount: number;
}

export function JoinRequestsList({
  requests,
  requestProfileMap,
  isLeader,
  teamId,
  requestsError,
  pendingRequestsCount,
}: JoinRequestsListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 3;
  const displayRequests = showAll ? requests : requests.slice(0, displayLimit);
  const hasMore = requests.length > displayLimit;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F4F4F5]">가입 요청</h3>
        {pendingRequestsCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#00C16A]/20 text-[#00C16A] font-medium">
            {pendingRequestsCount}
          </span>
        )}
      </div>
      {requestsError ? (
        <div className="text-xs text-red-400 py-2">
          가입 요청을 불러올 수 없습니다.
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-2">
          {displayRequests.map((request) => {
            const requestName = requestProfileMap.get(request.user_id);
            return (
              <div
                key={request.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C16A]/15 text-[#00E693] text-xs font-semibold shrink-0">
                    {requestName
                      ? requestName.charAt(0).toUpperCase()
                      : request.user_id.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#F4F4F5] truncate">
                    {requestName || "이름 없음"}
                  </span>
                </div>
                <ApproveRequest
                  requestId={request.id}
                  userId={request.user_id}
                  teamId={teamId}
                  isLeader={isLeader}
                />
              </div>
            );
          })}
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-xs text-[#71717A] hover:text-[#A1A1AA] text-center py-1 transition-colors cursor-pointer"
            >
              +{requests.length - displayLimit}개 더
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
          대기 중인 요청이 없습니다.
        </div>
      )}
    </section>
  );
}

