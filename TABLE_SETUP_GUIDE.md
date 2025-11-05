# Supabase 테이블 생성 가이드

## 문제

에러: `"Could not find the table 'public.teams' in the schema cache"`

이 에러는 Supabase에 `teams` 테이블이 생성되지 않았음을 의미합니다.

## 해결 방법

### 1단계: Supabase Dashboard에서 테이블 확인

1. Supabase Dashboard > Table Editor로 이동
2. `teams`, `members`, `matches`, `match_participants` 테이블이 있는지 확인

### 2단계: 스키마 실행

테이블이 없다면:

1. Supabase Dashboard > SQL Editor로 이동
2. `supabase/schema.sql` 파일의 **전체 내용**을 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭하여 실행

### 3단계: 스키마 실행 확인

실행 후:

1. Table Editor에서 테이블들이 생성되었는지 확인:
   - ✅ `teams`
   - ✅ `members`
   - ✅ `matches`
   - ✅ `match_participants`
   - ✅ `user_profiles` (프리미엄 기능용)

2. 각 테이블의 컬럼이 올바른지 확인

### 4단계: RLS 정책 확인

1. Authentication > Policies 메뉴로 이동
2. 각 테이블에 정책이 있는지 확인:
   - `teams`: 최소 3개 정책 (SELECT, INSERT, UPDATE)
   - `members`: 최소 3개 정책 (SELECT, INSERT, UPDATE)
   - `matches`: 최소 3개 정책 (SELECT, INSERT, UPDATE)
   - `match_participants`: 최소 2개 정책 (SELECT, INSERT/UPDATE)

### 5단계: 팀 생성 정책 수정

`supabase/fix_team_creation.sql` 파일도 실행:

1. SQL Editor에서 `supabase/fix_team_creation.sql` 내용 복사
2. 실행

## 빠른 체크리스트

- [ ] `supabase/schema.sql` 전체 실행 완료
- [ ] Table Editor에서 테이블 확인
- [ ] `supabase/fix_team_creation.sql` 실행 완료
- [ ] `supabase/premium_schema.sql` 실행 완료 (프리미엄 기능 사용 시)
- [ ] 브라우저 새로고침

## 테이블이 이미 있는 경우

만약 테이블이 이미 있다면:

1. SQL Editor에서 다음 쿼리 실행:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

2. 필요한 테이블이 없다면 `schema.sql` 실행
3. 테이블이 있지만 에러가 발생한다면:
   - Supabase 프로젝트 재시작 시도
   - 브라우저 캐시 삭제
   - 환경 변수 확인

