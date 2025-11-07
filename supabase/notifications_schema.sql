-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('team_request', 'request_approved', 'request_rejected', 'match_created', 'match_updated', 'match_cancelled', 'member_removed')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- 관련된 팀 ID, 경기 ID 등
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 알림만 볼 수 있음
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- RLS 정책: 사용자는 자신의 알림을 읽음 처리할 수 있음
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS 정책: 사용자는 자신의 알림을 삭제할 수 있음
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- RLS 정책: 시스템은 알림을 생성할 수 있음 (SECURITY DEFINER 함수 사용)
-- 직접 INSERT는 허용하지 않고 함수를 통해서만 생성

-- 알림 생성 함수 (SECURITY DEFINER로 권한 우회)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- updated_at 자동 업데이트 트리거 (필요시)
-- 알림은 읽음 처리만 하므로 updated_at은 필요 없을 수 있음

