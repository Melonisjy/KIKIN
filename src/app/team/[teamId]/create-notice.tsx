"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import styles from "@/styles/modal.module.scss";

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export function CreateNoticeModal({
  isOpen,
  onClose,
  teamId,
}: CreateNoticeModalProps) {
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 팀장 권한 확인
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member || member.role !== "leader") {
        throw new Error("팀장만 공지를 작성할 수 있습니다.");
      }

      // 공지 생성
      const { error: noticeError } = await supabase
        .from("team_notices")
        .insert({
          team_id: teamId,
          created_by: user.id,
          title: "", // 제목 제거
          content: content.trim(),
          is_pinned: isPinned,
        });

      if (noticeError) {
        throw new Error(`공지 작성 실패: ${noticeError.message}`);
      }

      // 성공
      setContent("");
      setIsPinned(false);
      setError(null);
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "공지 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 모달 애니메이션 처리
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // 모달이 닫힐 때 폼 초기화
      setContent("");
      setIsPinned(false);
      setError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${isAnimating ? styles.isOpen : ""}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`${styles.modalContent} ${isAnimating ? styles.isOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>공지 작성</h2>
          <button
            onClick={onClose}
            className={styles.modalClose}
            aria-label="모달 닫기"
            type="button"
            disabled={isLoading}
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="notice-content"
                  className="text-sm font-medium text-[#F4F4F5]"
                >
                  내용 <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notice-pinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-[#27272A] bg-[#181A1F] text-[#00C16A] focus:ring-2 focus:ring-[#00C16A] focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="notice-pinned"
                    className="text-sm text-[#A1A1AA] cursor-pointer"
                  >
                    상단 고정
                  </label>
                </div>
              </div>
              <textarea
                id="notice-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="공지 내용을 입력하세요"
                rows={6}
                className="w-full rounded-lg border border-[#27272A] bg-[#181A1F] px-4 py-2 text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] resize-none"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  작성 중...
                </>
              ) : (
                "작성하기"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

