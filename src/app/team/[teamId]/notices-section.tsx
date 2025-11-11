"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Megaphone,
  Pin,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { DeleteNotice } from "./delete-notice";
import { CreateNoticeButton } from "./create-notice-button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NoticesSectionProps {
  teamId: string;
  notices: any[];
  noticesError: any;
  isLeader: boolean;
  noticeAuthorMap: Record<string, string | null>;
  totalCount: number;
  totalMembers: number;
  ackStats: Record<string, { count: number; hasAcknowledged: boolean }>;
}

export function NoticesSection({
  teamId,
  notices,
  noticesError,
  isLeader,
  noticeAuthorMap,
  totalCount,
  totalMembers,
  ackStats,
}: NoticesSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [ackState, setAckState] = useState(ackStats);
  const [ackErrors, setAckErrors] = useState<Record<string, string>>({});
  const [loadingNoticeId, setLoadingNoticeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAckState(ackStats);
  }, [ackStats]);

  const handleAcknowledge = async (noticeId: string) => {
    const currentAck = ackState[noticeId];
    if (currentAck?.hasAcknowledged || loadingNoticeId === noticeId) {
      return;
    }

    setLoadingNoticeId(noticeId);
    setAckErrors((prev) => {
      if (!prev[noticeId]) return prev;
      const { [noticeId]: _ignored, ...rest } = prev;
      return rest;
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const { error } = await supabase.from("team_notice_receipts").insert({
        notice_id: noticeId,
        team_id: teamId,
        user_id: user.id,
      });

      const isDuplicate = error?.code === "23505";

      if (error && !isDuplicate) {
        throw new Error(error.message);
      }

      setAckState((prev) => {
        const previous = prev[noticeId] ?? {
          count: 0,
          hasAcknowledged: false,
        };
        const nextCount =
          previous.count + (previous.hasAcknowledged || isDuplicate ? 0 : 1);
        return {
          ...prev,
          [noticeId]: {
            count: nextCount,
            hasAcknowledged: true,
          },
        };
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setAckErrors((prev) => ({
        ...prev,
        [noticeId]:
          err?.message || "공지 확인 중 오류가 발생했습니다.",
      }));
    } finally {
      setLoadingNoticeId(null);
    }
  };

  const displayNotices = notices.slice(0, 3); // 최대 3개만 표시

  return (
    <div className="surface-layer rounded-lg p-4 border border-[var(--border-soft)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#A1A1AA]" />
          <h3 className="text-sm font-semibold text-[#F4F4F5]">공지</h3>
          {totalCount > 0 && (
            <span className="text-xs text-[#A1A1AA]">({totalCount})</span>
          )}
        </div>
        {isLeader && (
          <CreateNoticeButton
            teamId={teamId}
            className="h-7 px-2"
          />
        )}
      </div>

      {noticesError ? (
        <div className="text-xs text-red-400 py-2">
          공지 정보를 불러올 수 없습니다.
        </div>
      ) : displayNotices.length > 0 ? (
        <div className="space-y-2">
          {displayNotices.map((notice: any) => {
            const authorName = noticeAuthorMap[notice.created_by] || "팀장";
            const ackInfo = ackState[notice.id] ?? {
              count: 0,
              hasAcknowledged: false,
            };
            const isLoading = loadingNoticeId === notice.id || isPending;
            const contentPreview = notice.content.length > 50
              ? notice.content.slice(0, 50) + "..."
              : notice.content;

            return (
              <div
                key={notice.id}
                className="group p-2 rounded border border-[var(--border-soft)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${notice.is_pinned ? "bg-[#00C16A]/15 text-[#00C16A]" : "bg-[#F97316]/15 text-[#F97316]"}`}>
                    {notice.is_pinned ? (
                      <Pin className="h-3 w-3" />
                    ) : (
                      <Megaphone className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#F4F4F5] truncate">
                        {authorName}
                      </span>
                      <span className="text-xs text-[#71717A]">
                        {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {isLeader && (
                        <span className="text-xs text-[#71717A]">
                          ({ackInfo.count}/{totalMembers})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-2">
                      {contentPreview}
                    </p>
                    {!isLeader && !ackInfo.hasAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(notice.id)}
                        disabled={isLoading}
                        className="text-xs text-[#00C16A] hover:text-[#00E693] transition-colors flex items-center gap-1"
                        type="button"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        확인했습니다
                      </button>
                    )}
                    {!isLeader && ackInfo.hasAcknowledged && (
                      <div className="text-xs text-[#71717A] flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-[#00C16A]" />
                        확인 완료
                      </div>
                    )}
                  </div>
                  {isLeader && (
                    <DeleteNotice
                      noticeId={notice.id}
                      noticeTitle={notice.content.slice(0, 20) || "공지"}
                      isLeader={isLeader}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {notices.length > 3 && (
            <div className="text-xs text-[#A1A1AA] text-center py-1">
              +{notices.length - 3}개 더
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-[#A1A1AA] py-2 text-center">
          등록된 공지가 없습니다.
        </div>
      )}
    </div>
  );
}

