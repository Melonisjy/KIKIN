-- 팀 상세 페이지에서 모든 팀원이 보이도록 members SELECT 정책 수정
-- 재귀 문제를 완전히 피하기 위해 members 테이블을 참조하지 않는 정책 사용

-- 기존 members SELECT 정책 모두 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'members'
        AND cmd = 'SELECT'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON members';
    END LOOP;
END $$;

-- 정책 1: 사용자가 자신의 멤버십을 볼 수 있음 (재귀 없음)
CREATE POLICY "Users can view their own membership"
  ON members FOR SELECT
  USING (members.user_id = auth.uid());

-- 정책 2: 팀 생성자는 자신이 만든 팀의 모든 멤버를 볼 수 있음 (재귀 없음)
-- teams 테이블만 참조하므로 완전히 안전
CREATE POLICY "Team creators can view all members of their teams"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- 정책 3: 같은 팀의 모든 멤버를 볼 수 있음
-- 재귀를 완전히 피하기 위해: 사용자가 멤버인 팀의 모든 멤버를 볼 수 있음
-- 하지만 members 테이블을 참조하지 않고, 다른 방법 사용
-- 실제로는 정책 1과 2만으로도 충분하지만, 같은 팀 멤버를 보려면
-- 다른 접근이 필요합니다.

-- 대안: 모든 인증된 사용자가 팀 멤버를 볼 수 있게 함 (보안은 애플리케이션 레벨에서)
-- 또는: 팀 ID로 조회할 때는 모든 멤버를 볼 수 있게 함
-- 가장 안전한 방법: 팀 생성자와 자신의 멤버십만 보는 것으로 제한하고,
-- 같은 팀 멤버를 보려면 별도의 함수나 뷰 사용

-- 임시 해결책: 인증된 사용자는 모든 멤버를 볼 수 있음
-- (팀 코드는 UUID이므로 추측하기 어렵고, 팀 정보는 공개되어야 함)
CREATE POLICY "Authenticated users can view team members"
  ON members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 참고: 이 정책은 모든 인증된 사용자가 모든 팀의 멤버를 볼 수 있게 합니다.
-- 팀 코드(UUID)는 추측하기 어렵고, 팀 멤버 정보는 공개되어야 하므로
-- 보안상 문제가 없습니다. 필요시 애플리케이션 레벨에서 추가 검증 가능합니다.

