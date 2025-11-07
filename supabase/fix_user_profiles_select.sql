-- user_profiles 테이블의 SELECT 정책 수정
-- 팀 멤버들이 같은 팀의 다른 멤버들의 프로필(이름)을 볼 수 있도록 함

-- 기존 SELECT 정책은 유지하고, 새로운 정책 추가
-- (기존 정책을 삭제하지 않음 - 여러 정책이 OR 조건으로 작동)

-- 정책 1: 사용자가 자신의 프로필을 볼 수 있음 (이미 존재할 수 있음)
-- 중복 방지를 위해 IF NOT EXISTS 사용 불가 - DROP 후 재생성
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 정책 2: 팀 멤버들이 같은 팀의 다른 멤버들의 프로필을 볼 수 있음
-- 재귀를 피하기 위해 members 테이블을 조인하여 확인
DROP POLICY IF EXISTS "Team members can view profiles of their teammates" ON user_profiles;
CREATE POLICY "Team members can view profiles of their teammates"
  ON user_profiles FOR SELECT
  USING (
    -- 사용자가 이 사용자와 같은 팀의 멤버인지 확인
    EXISTS (
      SELECT 1 FROM members m1
      JOIN members m2 ON m1.team_id = m2.team_id
      WHERE m1.user_id = auth.uid()
      AND m2.user_id = user_profiles.id
    )
  );

-- 참고: 이 정책은 사용자가 멤버인 팀의 다른 멤버들의 프로필을 볼 수 있게 합니다.
-- members 테이블을 조인하여 같은 팀 멤버인지 확인합니다.

