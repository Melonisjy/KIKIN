"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Sparkles, UploadCloud, X, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/Toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  userEmail?: string | null;
}

const categories = ["버그 제보", "기능 제안", "디자인 관련", "기타 의견"];
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB

export function FeedbackModal({
  isOpen,
  onClose,
  userName,
  userEmail,
}: FeedbackModalProps) {
  const supabase = useMemo(() => createClient(), []);

  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<{ code: string; link: string } | null>(null);

  const resetState = () => {
    setCategory(categories[0]);
    setContent("");
    setIsAnonymous(false);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setIsSubmitting(false);
    setUploadMessage(null);
    setTicketInfo(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreview(null);
      return;
    }
    const url = URL.createObjectURL(screenshotFile);
    setScreenshotPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [screenshotFile]);

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    if (file.size > MAX_SCREENSHOT_SIZE) {
      setUploadMessage("스크린샷은 최대 5MB까지 업로드할 수 있어요.");
      event.target.value = "";
      return;
    }

    setUploadMessage(null);
    setScreenshotFile(file);
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile) return null;

    const extension = screenshotFile.name.split(".").pop() || "png";
    const filePath = `screenshots/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("feedback-screenshots")
      .upload(filePath, screenshotFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: screenshotFile.type,
      });

    if (uploadError) {
      console.error("screenshot upload error:", uploadError);
      setUploadMessage("스크린샷 업로드에 실패했어요. 텍스트만 전달할게요.");
      return null;
    }

    const { data } = supabase.storage
      .from("feedback-screenshots")
      .getPublicUrl(filePath);

    return data?.publicUrl ?? null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setUploadMessage("피드백 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setUploadMessage(null);
    setTicketInfo(null);

    try {
      const screenshotUrl = await uploadScreenshot();

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          screenshotUrl,
          isAnonymous,
        }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || "피드백 전송 중 오류가 발생했습니다.");
      }

      const { ticketCode, ticketLink } = await response.json();
      setTicketInfo({ code: ticketCode, link: ticketLink });

      toast.success("피드백이 접수되었습니다. 티켓 정보를 확인해주세요.");
      setContent("");
      setScreenshotFile(null);
    } catch (error: any) {
      console.error("feedback submit error:", error);
      toast.error(
        error?.message || "피드백 전송 중 문제가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketLink = async () => {
    if (!ticketInfo) return;
    try {
      await navigator.clipboard.writeText(ticketInfo.link);
      toast.success("티켓 링크를 복사했어요.");
    } catch {
      toast.error("복사에 실패했습니다. 직접 선택해서 복사해주세요.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="피드백 보내기">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-[#2C354B] bg-[#182135] p-4">
          <p className="text-sm text-[#A1A1AA] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00C16A]" />
            킥-인을 더 나은 서비스로 만들어주세요!
          </p>
        </div>

        <div className="grid gap-4">
          <div>
            <label
              htmlFor="feedback-category"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              카테고리
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-2 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A]"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="feedback-content"
              className="block text-sm font-medium text-[#F4F4F5] mb-2"
            >
              피드백 내용
            </label>
            <textarea
              id="feedback-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="어떤 점을 개선하면 좋을까요?"
              rows={5}
              className="w-full rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-3 text-sm text-[#F4F4F5] placeholder:text-[#6F7280] focus:outline-none focus:border-[#00C16A] focus:ring-1 focus:ring-[#00C16A] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#F4F4F5]">
              스크린샷 (선택)
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="feedback-screenshot"
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#3F4A63] bg-[#141824] px-4 py-2 text-sm text-[#A1A1AA] cursor-pointer transition hover:border-[#00C16A] hover:text-[#00C16A]"
              >
                <UploadCloud className="h-4 w-4" />
                {screenshotFile ? "다시 선택하기" : "이미지 첨부"}
              </label>
              {screenshotFile && (
                <button
                  type="button"
                  onClick={() => setScreenshotFile(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#3F4A63] px-3 py-2 text-xs text-[#A1A1AA] transition hover:border-red-500/40 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                  제거
                </button>
              )}
            </div>
            <input
              id="feedback-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleScreenshotChange}
            />
            {screenshotPreview && (
              <div className="relative mt-2 overflow-hidden rounded-lg border border-[#2C354B] bg-[#101217]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotPreview}
                  alt="스크린샷 미리보기"
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#F4F4F5]">익명으로 보내기</p>
            <p className="text-xs text-[#6F7280]">
              익명으로 제출해도 운영진은 내용을 검토할 수 있어요.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            <div className="h-5 w-11 rounded-full bg-[#2C354B] transition peer-checked:bg-[#00C16A]" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[#F4F4F5] transition-transform peer-checked:translate-x-6" />
          </label>
        </div>

        {!isAnonymous && (
          <div className="rounded-lg border border-[#2C354B] bg-[#141824] px-4 py-3 text-xs text-[#6F7280]">
            <p className="font-medium text-[#A1A1AA]">
              회신이 필요하면 아래 정보를 함께 전달할게요.
            </p>
            <p className="mt-1">
              이름: {userName || "미등록"}, 이메일: {userEmail || "미등록"}
            </p>
          </div>
        )}

        {uploadMessage && (
          <div className="rounded-lg border border-[#3F4A63] bg-[#141824] px-4 py-3 text-sm text-[#A1A1AA]">
            {uploadMessage}
          </div>
        )}

        {ticketInfo && (
          <div className="space-y-3 rounded-lg border border-[#3F4A63] bg-[#101217] px-4 py-4">
            <div className="flex items-center gap-2 text-[#00C16A]">
              <MessageSquare className="h-4 w-4" />
              <p className="text-sm font-semibold">피드백 티켓이 생성되었습니다.</p>
            </div>
            <p className="text-xs text-[#6F7280]">
              아래 링크를 저장해두면 진행 상황을 언제든지 확인할 수 있어요.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#2C354B] bg-[#141824] px-3 py-1 text-xs text-[#A1A1AA]">
                티켓 코드: {ticketInfo.code}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleCopyTicketLink}
              >
                <Copy className="h-4 w-4" />
                링크 복사
              </Button>
              <Link
                href={ticketInfo.link}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-[#2C354B] px-3 py-2 text-xs text-[#F4F4F5] transition hover:border-[#00C16A] hover:text-[#00C16A]"
              >
                티켓 확인
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            닫기
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                전송 중...
              </>
            ) : (
              "제출하기"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

