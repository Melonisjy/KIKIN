# 팀 생성 문제 해결 가이드

## 문제: 테이블은 있는데 "Could not find the table" 에러

테이블이 존재하는데도 에러가 발생한다면 다음을 시도하세요:

## 해결 방법

### 1단계: Supabase 스키마 캐시 리프레시

1. Supabase Dashboard > SQL Editor
2. 다음 SQL 실행:
```sql
NOTIFY pgrst, 'reload schema';
```

또는 `supabase/refresh_cache.sql` 파일 실행

### 2단계: Supabase 프로젝트 재시작

1. Supabase Dashboard > Settings > General
2. 프로젝트 재시작 (일시 중지 후 재개)

### 3단계: RLS 정책 확인

1. Supabase Dashboard > Authentication > Policies
2. `teams` 테이블의 정책 확인:
   - ✅ "Users can create teams" (INSERT)
   - ✅ "Users can view teams they are members of or created" (SELECT)
   - ✅ "Team leaders can update their teams" (UPDATE)

3. `members` 테이블의 정책 확인:
   - ✅ "Users can add themselves when creating team or leaders can add members" (INSERT)

### 4단계: 환경 변수 확인

`.env.local` 파일이 올바른지 확인:

```bash
# 터미널에서 확인
cat .env.local | grep SUPABASE
```

다음 값들이 있어야 합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5단계: 브라우저 캐시 삭제

1. 브라우저 강력 새로고침: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
2. 개발 서버 재시작: `npm run dev`

### 6단계: 직접 테스트

Supabase Dashboard > SQL Editor에서 직접 INSERT 테스트:

```sql
-- 현재 사용자 ID 확인 후 실행
INSERT INTO teams (name, description, created_by)
VALUES ('테스트팀', '테스트용', 'YOUR_USER_ID_HERE')
RETURNING *;
```

이것이 성공하면 RLS 정책은 문제없는 것입니다.

## 추가 확인사항

### API 설정 확인
1. Supabase Dashboard > Settings > API
2. "Project URL"과 "anon public" 키가 올바른지 확인
3. `.env.local`의 값과 일치하는지 확인

### 네트워크 확인
브라우저 개발자 도구 > Network 탭에서:
1. `/rest/v1/teams` 요청이 있는지 확인
2. 응답 코드 확인 (200, 401, 403 등)
3. 에러 메시지 확인

## 여전히 안 되는 경우

1. **Supabase 프로젝트가 완전히 설정될 때까지 기다리기** (몇 분)
2. **다른 브라우저에서 테스트**
3. **시크릿 모드에서 테스트** (확장 프로그램 간섭 제거)
4. **Supabase 지원팀에 문의**

## 디버깅 정보 수집

브라우저 콘솔에서 다음 정보를 확인하세요:

```javascript
// 콘솔에서 실행
const { data, error } = await supabase.from('teams').select('*').limit(1);
console.log('Data:', data);
console.log('Error:', error);
```

이 정보를 공유해주시면 더 정확한 도움을 드릴 수 있습니다.

