/**
 * 알림 생성 유틸리티
 * Supabase 함수를 통해 알림 생성
 */

import { createClient } from "@/lib/supabase/client";

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
 * 알림 생성 (클라이언트 사이드)
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // RPC 함수 호출
    const { data, error } = await supabase.rpc("create_notification", {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_related_id: params.relatedId || null,
    });

    if (error) {
      // 개발 환경에서만 로깅
      if (process.env.NODE_ENV === "development") {
        console.error("알림 생성 오류:", error);
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === "development") {
      console.error("알림 생성 예외:", error);
    }
    return { success: false, error: error.message };
  }
}

/**
 * 팀 가입 요청 알림 생성 (팀장에게)
 */
export async function notifyTeamRequest(
  leaderUserId: string,
  requesterName: string,
  teamId: string
) {
  return createNotification({
    userId: leaderUserId,
    type: "team_request",
    title: "새로운 가입 요청",
    message: `${requesterName}님이 팀 가입을 요청했습니다.`,
    relatedId: teamId,
  });
}

/**
 * 가입 요청 승인 알림 생성 (요청자에게)
 */
export async function notifyRequestApproved(
  requesterUserId: string,
  teamName: string,
  teamId: string
) {
  return createNotification({
    userId: requesterUserId,
    type: "request_approved",
    title: "가입 요청이 승인되었습니다",
    message: `${teamName} 팀의 가입 요청이 승인되었습니다.`,
    relatedId: teamId,
  });
}

/**
 * 가입 요청 거절 알림 생성 (요청자에게)
 */
export async function notifyRequestRejected(
  requesterUserId: string,
  teamName: string,
  teamId: string
) {
  return createNotification({
    userId: requesterUserId,
    type: "request_rejected",
    title: "가입 요청이 거절되었습니다",
    message: `${teamName} 팀의 가입 요청이 거절되었습니다.`,
    relatedId: teamId,
  });
}

/**
 * 경기 생성 알림 생성 (팀원들에게)
 */
export async function notifyMatchCreated(
  teamMemberIds: string[],
  matchDate: string,
  teamName: string,
  matchId: string
) {
  const date = new Date(matchDate).toLocaleDateString("ko-KR");
  const promises = teamMemberIds.map((userId) =>
    createNotification({
      userId,
      type: "match_created",
      title: "새로운 경기가 생성되었습니다",
      message: `${teamName} 팀의 ${date} 경기가 생성되었습니다.`,
      relatedId: matchId,
    })
  );

  await Promise.all(promises);
}

/**
 * 팀원 방출 알림 생성 (방출된 팀원에게)
 */
export async function notifyMemberRemoved(
  removedUserId: string,
  teamName: string,
  teamId: string
) {
  return createNotification({
    userId: removedUserId,
    type: "member_removed",
    title: "팀에서 방출되었습니다",
    message: `${teamName} 팀에서 방출되었습니다.`,
    relatedId: teamId,
  });
}
