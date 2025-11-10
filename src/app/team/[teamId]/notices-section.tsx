"use client";

import { useState, useEffect } from "react";
import { Megaphone, Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { DeleteNotice } from "./delete-notice";
import { CreateNoticeButton } from "./create-notice-button";
import { Button } from "@/components/ui/button";

interface NoticesSectionProps {
  teamId: string;
  notices: any[];
  noticesError: any;
  isLeader: boolean;
  noticeAuthorMap: Record<string, string | null>;
  totalCount: number;
}

const NOTICES_PER_PAGE = 5;

export function NoticesSection({
  teamId,
  notices,
  noticesError,
  isLeader,
  noticeAuthorMap,
  totalCount,
}: NoticesSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalCount / NOTICES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
  const endIndex = startIndex + NOTICES_PER_PAGE;
  const displayedNotices = notices.slice(startIndex, endIndex);

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
            return (
              <div
                key={notice.id}
                className="group rounded-xl border border-[#2A2C34] bg-[#191C23] p-5 transition-all duration-200 hover:border-[#00C16A]/40 hover:bg-[#1E222B] hover:-translate-y-0.5"
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
                <div className="mt-4 border-t border-[#27272A]/80 pt-4">
                  <p className="text-sm text-[#D4D4D8] whitespace-pre-wrap leading-relaxed transition-colors duration-200 group-hover:text-[#F4F4F5]">
                    {notice.content}
                  </p>
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
        <div className="rounded-lg border border-dashed border-[#27272A] bg-[#27272A]/50 p-8 text-center transition-all duration-200 hover:border-[#3B3D48] hover:bg-[#2B2D33]">
          <Megaphone className="mx-auto h-12 w-12 text-[#A1A1AA] mb-4" />
          <p className="text-[#A1A1AA]">등록된 공지가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

