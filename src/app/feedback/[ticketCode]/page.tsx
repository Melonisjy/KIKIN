import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageSquare, Calendar, Camera } from "lucide-react";

interface PageProps {
  params: Promise<{ ticketCode: string }>;
}

export default async function FeedbackTicketPage({ params }: PageProps) {
  const { ticketCode } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_submissions")
    .select(
      "ticket_code, category, content, screenshot_url, status, created_at, is_anonymous"
    )
    .eq("ticket_code", ticketCode)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const createdAt = data.created_at
    ? new Date(data.created_at).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로 돌아가기
      </Link>

      <div className="mt-6 rounded-2xl border border-[#27272A] bg-[#181A1F] p-8 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 text-[#00C16A]">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                피드백 티켓
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#F4F4F5]">
              #{data.ticket_code}
            </h1>
          </div>
          <div className="rounded-full border border-[#27272A] bg-[#101217] px-4 py-1.5 text-sm text-[#A1A1AA]">
            상태: {data.status}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#27272A] bg-[#101217] px-4 py-3">
            <p className="text-xs text-[#6F7280] uppercase tracking-[0.2em]">
              카테고리
            </p>
            <p className="mt-1 text-sm text-[#F4F4F5]">{data.category}</p>
          </div>
          <div className="rounded-lg border border-[#27272A] bg-[#101217] px-4 py-3">
            <p className="flex items-center gap-1 text-xs text-[#6F7280] uppercase tracking-[0.2em]">
              <Calendar className="h-4 w-4" />
              등록 일시
            </p>
            <p className="mt-1 text-sm text-[#F4F4F5]">{createdAt}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-[#F4F4F5] mb-2">내용</p>
          <div className="rounded-lg border border-[#27272A] bg-[#101217] px-4 py-4 text-sm text-[#D4D4D8] whitespace-pre-wrap leading-relaxed">
            {data.content}
          </div>
        </div>

        {data.screenshot_url && (
          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#F4F4F5] mb-2">
              <Camera className="h-4 w-4" />
              첨부한 스크린샷
            </p>
            <div className="overflow-hidden rounded-lg border border-[#27272A] bg-[#101217]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.screenshot_url}
                alt="첨부된 스크린샷"
                className="w-full max-h-[420px] object-contain bg-[#0F1115]"
              />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-[#27272A] bg-[#101217] px-4 py-4 text-xs text-[#6F7280] leading-relaxed">
          <p>
            티켓 코드를 저장해두시면 진행 상황을 다시 확인하거나 운영진에게
            문의할 때 활용할 수 있어요.
          </p>
          {!data.is_anonymous && (
            <p className="mt-2">
              운영진이 추가 정보가 필요할 경우 등록된 이메일로 연락을 드릴 수
              있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

