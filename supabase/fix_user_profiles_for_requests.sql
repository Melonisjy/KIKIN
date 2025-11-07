-- user_profiles 테이블에 가입 요청 관련 정책 추가
-- 팀장이 자신의 팀에 대한 가입 요청이 있는 사용자의 프로필을 볼 수 있도록 함

-- 정책: 팀장은 자신의 팀에 대한 가입 요청이 있는 사용자의 프로필을 볼 수 있음
DROP POLICY IF EXISTS "Team leaders can view profiles of requesters" ON user_profiles;

CREATE POLICY "Team leaders can view profiles of requesters"
  ON user_profiles FOR SELECT
  USING (
    -- 팀장이 자신이 생성한 팀에 대한 가입 요청이 있는 사용자의 프로필을 볼 수 있음
    EXISTS (
      SELECT 1 FROM team_requests tr
      JOIN teams t ON tr.team_id = t.id
      WHERE tr.user_id = user_profiles.id
      AND tr.status = 'pending'
      AND t.created_by = auth.uid()
    )
  );

-- 참고: 이 정책은 팀장이 자신의 팀에 대한 pending 가입 요청이 있는 사용자의 프로필을 볼 수 있게 합니다.
-- 재귀를 피하기 위해 teams 테이블의 created_by를 직접 확인합니다.

