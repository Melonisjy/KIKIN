# RLS 무한 재귀 문제 해결 가이드

## 문제 원인
`members` 테이블의 RLS 정책이 자기 자신(`members`)을 참조하면서 무한 재귀가 발생합니다.

## 해결 방법

### 1단계: Supabase SQL Editor 열기
- Supabase Dashboard → SQL Editor 이동

### 2단계: 정책 제거 및 재생성
`supabase/fix_all_members_policies.sql` 파일의 전체 내용을 복사하여 SQL Editor에 붙여넣고 실행합니다.

이 스크립트는:
- ✅ 모든 기존 `members` 정책 제거
- ✅ `teams` 테이블만 참조하는 단순한 정책 생성 (재귀 없음)
- ✅ `members` 테이블을 절대 자기 참조하지 않음

### 3단계: 확인
실행 후 다음 쿼리로 정책이 올바르게 생성되었는지 확인:

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('members', 'teams')
ORDER BY tablename, cmd;
```

예상 결과:
- `members`: "Users can view members of their created teams" (SELECT)
- `members`: "Users can add members to teams they created" (INSERT)
- `teams`: "Users can view teams they created" (SELECT)
- `teams`: "Members can view their teams" (SELECT)

### 4단계: 테스트
1. 브라우저 새로고침
2. `/team/new`에서 팀 생성 시도
3. 오류가 없어야 합니다

## 문제가 계속되면

1. **Supabase 캐시 새로고침**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. **정책이 실제로 삭제되었는지 확인**:
   ```sql
   SELECT policyname 
   FROM pg_policies 
   WHERE tablename = 'members';
   ```
   결과가 비어있어야 합니다 (새 정책 생성 전).

3. **RLS가 활성화되어 있는지 확인**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'members';
   ```
   `rowsecurity`가 `true`여야 합니다.

4. **브라우저 콘솔 확인**: 개발자 도구(F12) → Console 탭에서 정확한 오류 메시지 확인

