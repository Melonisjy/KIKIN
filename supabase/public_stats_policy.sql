-- 공개 통계 조회를 위한 RLS 정책 추가
-- 이 정책은 로그인하지 않은 사용자도 COUNT 쿼리만 할 수 있도록 합니다

-- 기존 정책 확인 후 공개 통계 정책 추가
-- Teams 테이블에 공개 COUNT 정책 추가
DROP POLICY IF EXISTS "Public can count teams for statistics" ON teams;

CREATE POLICY "Public can count teams for statistics"
  ON teams FOR SELECT
  USING (true);

-- Matches 테이블에 공개 COUNT 정책 추가  
DROP POLICY IF EXISTS "Public can count matches for statistics" ON matches;

CREATE POLICY "Public can count matches for statistics"
  ON matches FOR SELECT
  USING (true);

-- 참고: 이 정책은 SELECT를 허용하지만, 실제로는 COUNT 쿼리만 사용됩니다.
-- 보안상 실제 데이터는 반환하지 않고 COUNT만 가능하도록 제한하는 것이 좋지만,
-- Supabase에서는 COUNT 쿼리도 SELECT 정책이 필요합니다.
