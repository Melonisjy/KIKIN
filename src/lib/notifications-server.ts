/**
 * 알림 생성 유틸리티 (서버 사이드)
 * Supabase 함수를 통해 알림 생성
 */

import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "team_request"
  | "request_approved"
  | "request_rejected"
  | "match_created"
  | "match_updated"
  | "match_cancelled"
  | "member_removed";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string | null;
}

/**
 * 알림 생성 (서버 사이드)
 */
export async function createNotificationServer(
  params: CreateNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // RPC 함수 호출
    const { data, error } = await supabase.rpc("create_notification", {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_related_id: params.relatedId || null,
    });

    if (error) {
      // 알림 생성 실패는 로깅만 (사용자에게는 표시하지 않음)
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    // 알림 생성 예외는 로깅만
    return { success: false, error: error.message };
  }
}

/**
 * 경기 생성 알림 생성 (팀원들에게) - 서버 사이드
 */
export async function notifyMatchCreatedServer(
  teamMemberIds: string[],
  matchDate: string,
  teamName: string,
  matchId: string
) {
  const date = new Date(matchDate).toLocaleDateString("ko-KR");
  const promises = teamMemberIds.map((userId) =>
    createNotificationServer({
      userId,
      type: "match_created",
      title: "새로운 경기가 생성되었습니다",
      message: `${teamName} 팀의 ${date} 경기가 생성되었습니다.`,
      relatedId: matchId,
    })
  );

  await Promise.all(promises);
}

