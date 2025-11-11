"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Megaphone,
  Pin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { DeleteNotice } from "./delete-notice";
import { CreateNoticeButton } from "./create-notice-button";
import { Button } from "@/components/ui/button";
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

const NOTICES_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalCount / NOTICES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
  const endIndex = startIndex + NOTICES_PER_PAGE;
  const displayedNotices = notices.slice(startIndex, endIndex);
  const router = useRouter();
  const supabase = createClient();
  const [ackState, setAckState] = useState(ackStats);
  const [ackErrors, setAckErrors] = useState<Record<string, string>>({});
  const [loadingNoticeId, setLoadingNoticeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAckState(ackStats);
  }, [ackStats]);

  // totalCount가 변경되고 현재 페이지에 공지가 없으면 이전 페이지로 이동
  useEffect(() => {
    if (totalCount > 0 && displayedNotices.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    } else if (totalCount === 0) {
      setCurrentPage(1);
    }
  }, [totalCount, displayedNotices.length, currentPage]);

  // totalPages가 변경되면 현재 페이지가 유효한 범위인지 확인
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-[#F4F4F5]" />
          <h2 className="text-2xl font-semibold text-[#F4F4F5]">공지</h2>
          {totalCount > 0 && (
            <span className="text-sm text-[#A1A1AA]">({totalCount})</span>
          )}
        </div>
        {isLeader && <CreateNoticeButton teamId={teamId} />}
      </div>

      {noticesError ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>공지 정보를 불러오는 중 오류가 발생했습니다.</p>
          <p className="mt-2 text-sm">{noticesError.message}</p>
        </div>
      ) : displayedNotices.length > 0 ? (
        <>
          <div className="space-y-3">
            {displayedNotices.map((notice: any) => {
              const authorName = noticeAuthorMap[notice.created_by] || "팀장";
              const ackInfo = ackState[notice.id] ?? {
                count: 0,
                hasAcknowledged: false,
              };
              const outstandingCount = Math.max(totalMembers - ackInfo.count, 0);
              const statusText = isLeader
                ? ackInfo.count >= totalMembers
                  ? "모든 팀원이 공지를 확인했습니다."
                  : `확인 대기: ${outstandingCount}명`
                : ackInfo.hasAcknowledged
                ? "확인을 남겨주셔서 감사합니다!"
                : `현재 ${ackInfo.count}명 확인`;
              const isLoading = loadingNoticeId === notice.id || isPending;

              return (
                <div
                  key={notice.id}
                  className="group rounded-xl border border-[#2A2C34] bg-[#182235] p-5 transition-all duration-200 hover:border-[#00C16A]/40 hover:bg-[#1E222B] hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00C16A]/10 text-[#00C16A]">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#6F7280]">
                          <span>공지</span>
                          {notice.is_pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#00C16A]/40 bg-[#00C16A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00C16A]">
                              <Pin className="h-3 w-3" />
                              고정
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                          <span className="font-semibold text-[#F4F4F5] transition-colors duration-200 group-hover:text-white">
                            {authorName}
                          </span>
                          <span className="text-[#31333D]">•</span>
                          <span className="transition-colors duration-200 group-hover:text-[#D4D4D8]">
                            {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isLeader && (
                      <DeleteNotice
                        noticeId={notice.id}
                        noticeTitle={notice.content.slice(0, 20) || "공지"}
                        isLeader={isLeader}
                      />
                    )}
                  </div>
                  <div className="mt-4 border-t border-[#2C354B]/80 pt-4">
                    <p className="text-sm text-[#D4D4D8] whitespace-pre-wrap leading-relaxed transition-colors duration-200 group-hover:text-[#F4F4F5]">
                      {notice.content}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-[#2C354B]/60 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 text-xs text-[#6F7280]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#2C354B] bg-[#1F2536] px-3 py-1 font-semibold text-[#A0AABE]">
                        확인 {ackInfo.count} / {totalMembers}
                      </span>
                      <span className="text-[#A0AABE]">{statusText}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Button
                        variant={ackInfo.hasAcknowledged ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAcknowledge(notice.id)}
                        disabled={ackInfo.hasAcknowledged || isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : ackInfo.hasAcknowledged ? (
                          <CheckCircle className="h-4 w-4 text-[#9FF4D2]" />
                        ) : null}
                        {ackInfo.hasAcknowledged ? "확인 완료" : "확인했습니다"}
                      </Button>
                      {ackErrors[notice.id] ? (
                        <p className="text-xs text-destructive">
                          {ackErrors[notice.id]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 현재 페이지 주변만 표시
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="text-[#A1A1AA] px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-[#2C354B] bg-[#2C354B]/50 p-8 text-center transition-all duration-200 hover:border-[#3F4A63] hover:bg-[#2B2D33]">
          <Megaphone className="mx-auto h-12 w-12 text-[#A1A1AA] mb-4" />
          <p className="text-[#A1A1AA]">등록된 공지가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

