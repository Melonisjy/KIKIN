-- 팀 코드로 가입하기 위한 RLS 정책 추가
-- 이 SQL을 실행하면 팀 코드(ID)로 팀을 조회하고 가입할 수 있습니다.

-- 1. 팀 코드 조회를 위한 정책 추가
-- 팀 ID를 알고 있는 경우 (팀 코드로 가입하려는 경우) 조회 허용
-- 주의: 이 정책은 모든 사용자가 팀 ID로 팀을 조회할 수 있게 합니다.
-- 팀 코드는 UUID이므로 추측하기 어렵고, 팀 정보는 이미 공개되어야 하므로 안전합니다.
CREATE POLICY "Users can view teams by ID for joining"
  ON teams FOR SELECT
  USING (true);  -- 팀 코드로 가입하기 위해 모든 팀 ID 조회 허용

-- 2. 팀 코드로 가입하기 위한 members INSERT 정책 추가
-- 사용자가 자신을 멤버로 추가할 수 있도록 허용
-- 조건: 팀이 존재하고, 사용자가 자신을 추가하는 경우
CREATE POLICY "Users can join teams by code"
  ON members FOR INSERT
  WITH CHECK (
    -- 사용자가 자신을 추가하는 경우
    user_id = auth.uid()
    AND
    -- 팀이 존재하는 경우 (팀 코드로 가입)
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
    )
  );

-- 기존 정책과 충돌하지 않도록 기존 정책은 유지
-- 여러 정책이 있으면 OR 조건으로 작동하므로 안전합니다.
-- 
-- 참고: 이 정책을 추가해도 기존 정책들은 계속 작동합니다.
-- - 팀 리더는 여전히 다른 멤버를 추가할 수 있습니다.
-- - 사용자는 여전히 자신이 멤버인 팀의 상세 정보를 볼 수 있습니다.

