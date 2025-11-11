import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }

    // 서비스 역할 키가 있으면 사용 (RLS 우회), 없으면 anon key 사용 (공개 정책 필요)
    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 오늘 경기 준비 중인 팀 수 (취소되지 않은 경기)
    // DISTINCT team_id를 사용하여 중복 제거 (같은 팀이 여러 경기를 가질 수 있음)
    const { data: todayMatches } = await supabase
      .from("matches")
      .select("team_id")
      .eq("date", today)
      .neq("status", "cancelled");
    
    const uniqueTodayTeamIds = todayMatches 
      ? Array.from(new Set(todayMatches.map((m: any) => m.team_id)))
      : [];
    const todayMatchesCount = uniqueTodayTeamIds.length;

    // 활성 팀 수만 카운트 (멤버가 있는 팀만)
    // 멤버가 없는 팀은 삭제된 팀이거나 사용되지 않는 팀일 수 있음
    const { data: members } = await supabase
      .from("members")
      .select("team_id");
    
    const uniqueActiveTeamIds = members
      ? Array.from(new Set(members.map((m: any) => m.team_id)))
      : [];
    
    const totalTeamsCount = uniqueActiveTeamIds.length;

    return NextResponse.json({
      todayMatchesCount: todayMatchesCount || 0,
      totalTeamsCount: totalTeamsCount || 0,
    });
  } catch (error: any) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      {
        todayMatchesCount: 0,
        totalTeamsCount: 0,
      },
      { status: 500 }
    );
  }
}

