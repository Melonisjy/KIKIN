# 팀 생성 문제 빠른 해결

## 문제
테이블은 있는데 `"Could not find the table 'public.teams' in the schema cache"` 에러 발생

## 빠른 해결 (3단계)

### 1단계: Supabase 스키마 캐시 리프레시

Supabase Dashboard > SQL Editor에서 실행:

```sql
NOTIFY pgrst, 'reload schema';
```

### 2단계: 브라우저 새로고침

- 강력 새로고침: **Cmd+Shift+R** (Mac) / **Ctrl+Shift+R** (Windows)
- 개발 서버 재시작: 터미널에서 `Ctrl+C` 후 `npm run dev`

### 3단계: 다시 시도

`/team/new` 페이지에서 다시 팀 생성 시도

## 안 되면 추가 확인

### Supabase 프로젝트 재시작
1. Supabase Dashboard > Settings > General
2. 프로젝트 일시 중지 후 재개

### RLS 정책 확인
Supabase Dashboard > Authentication > Policies에서:
- `teams` 테이블에 "Users can create teams" 정책이 있는지 확인
- `members` 테이블에 "Users can add themselves when creating team..." 정책이 있는지 확인

없다면 `supabase/fix_team_creation.sql` 실행

### 환경 변수 확인
```bash
# 터미널에서
cat .env.local
```

`NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 있어야 함

## 여전히 안 되면

브라우저 콘솔(F12)의 전체 에러 메시지를 확인하고 알려주세요.

