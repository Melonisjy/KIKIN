"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // 현재 페이지 주변
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // 마지막 페이지
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-1 md:gap-2",
        className
      )}
      aria-label="페이지네이션"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg",
          "border border-[#2C354B] bg-[#141824] text-[#F4F4F5]",
          "transition-all duration-200 hover:bg-[#1A2333] hover:border-[#00C16A]/40",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#141824]",
          "min-h-[44px] min-w-[44px] touch-manipulation"
        )}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-[#71717A] text-sm"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg text-sm font-medium",
                "transition-all duration-200 min-h-[44px] min-w-[44px] touch-manipulation",
                isActive
                  ? "bg-[#00C16A] text-[#0F1115] font-semibold"
                  : "border border-[#2C354B] bg-[#141824] text-[#F4F4F5] hover:bg-[#1A2333] hover:border-[#00C16A]/40"
              )}
              aria-label={`페이지 ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg",
          "border border-[#2C354B] bg-[#141824] text-[#F4F4F5]",
          "transition-all duration-200 hover:bg-[#1A2333] hover:border-[#00C16A]/40",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#141824]",
          "min-h-[44px] min-w-[44px] touch-manipulation"
        )}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

