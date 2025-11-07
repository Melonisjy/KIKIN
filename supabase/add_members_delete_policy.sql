-- 팀원 방출을 위한 members DELETE 정책 추가
-- 재귀를 피하기 위해 teams 테이블만 참조

-- 기존 DELETE 정책이 있다면 삭제
DROP POLICY IF EXISTS "Team leaders can remove members" ON members;
DROP POLICY IF EXISTS "Users can delete members" ON members;
DROP POLICY IF EXISTS "Team creators can remove members" ON members;

-- 팀을 생성한 사람만 팀원을 방출할 수 있는 정책
-- 재귀를 완전히 피하기 위해 teams 테이블만 참조
CREATE POLICY "Team creators can remove members"
  ON members FOR DELETE
  USING (
    -- 팀을 생성한 사람인지 확인 (teams 테이블만 참조 - 재귀 없음)
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- 참고: 이 정책은 팀을 생성한 사람만 팀원을 방출할 수 있게 합니다.
-- 팀을 생성한 사람은 일반적으로 팀장이므로, 팀장이 팀원을 방출할 수 있습니다.
-- 재귀 문제를 완전히 피하기 위해 teams 테이블만 참조합니다.

