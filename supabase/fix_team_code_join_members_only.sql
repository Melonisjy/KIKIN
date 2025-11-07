-- 팀 코드로 가입하기 위한 members INSERT 정책만 추가
-- (팀 조회 정책은 이미 존재하는 경우)

-- 팀 코드로 가입하기 위한 members INSERT 정책 추가
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

