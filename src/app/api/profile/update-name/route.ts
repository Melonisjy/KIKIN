import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "이름은 100자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // Update 또는 Insert
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);

    if (updateError) {
      // 레코드가 없을 수 있으므로 insert 시도
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          name: name.trim(),
        });

      if (insertError) {
        console.error("Error updating/inserting name:", insertError);
        return NextResponse.json(
          { error: `이름 저장 실패: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `예기치 않은 오류: ${error?.message || "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}

