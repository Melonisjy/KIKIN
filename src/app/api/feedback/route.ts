"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function createTicketCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { category, content, screenshotUrl, isAnonymous } =
      await request.json();

    if (!category || !content) {
      return NextResponse.json(
        { message: "카테고리와 내용을 모두 작성해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const ticketCode = createTicketCode();

    const { error: insertError } = await supabase
      .from("feedback_submissions")
      .insert({
        ticket_code: ticketCode,
        user_id: user.id,
        user_email: user.email,
        category,
        content,
        screenshot_url: screenshotUrl || null,
        is_anonymous: !!isAnonymous,
      });

    if (insertError) {
      console.error("feedback insert error:", insertError);
      return NextResponse.json(
        {
          message:
            "피드백 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://kikin.app";
    const ticketLink = `${origin}/feedback/${ticketCode}`;

    return NextResponse.json({
      ticketCode,
      ticketLink,
    });
  } catch (error) {
    console.error("feedback api error:", error);
    return NextResponse.json(
      {
        message:
          "피드백을 처리하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketCode = searchParams.get("ticket");

  if (!ticketCode) {
    return NextResponse.json(
      { message: "티켓 코드가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_submissions")
    .select(
      "ticket_code, category, content, screenshot_url, status, created_at, is_anonymous"
    )
    .eq("ticket_code", ticketCode)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: "티켓을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ feedback: data });
}

