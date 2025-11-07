# 배포 가이드

## 환경 변수 설정

### 필수 환경 변수

`.env.local` 파일에 다음 변수들을 설정해야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 환경 변수 가져오기

1. Supabase Dashboard > Settings > API로 이동
2. Project URL을 `NEXT_PUBLIC_SUPABASE_URL`에 복사
3. anon/public key를 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 복사

## 데이터베이스 설정

### 1. 기본 스키마 생성

Supabase SQL Editor에서 다음 파일들을 순서대로 실행:

1. `supabase/schema.sql` - 기본 테이블 생성
2. `supabase/add_user_name.sql` - 사용자 프로필 테이블 생성
3. `supabase/team_notices_schema.sql` - 공지사항 테이블 생성
4. `supabase/team_requests_schema.sql` - 가입 요청 테이블 생성
5. `supabase/notifications_schema.sql` - 알림 테이블 생성

### 2. RLS 정책 확인

각 테이블에 RLS가 활성화되어 있고 적절한 정책이 설정되어 있는지 확인하세요.

### 3. 함수 생성

`supabase/notifications_schema.sql`에 포함된 `create_notification` 함수가 생성되었는지 확인하세요.

## Vercel 배포

### 1. 프로젝트 연결

1. Vercel Dashboard에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. 브랜치 선택 (main 또는 staging)

### 2. 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에서:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. 빌드 설정

- Framework Preset: Next.js
- Build Command: `npm run build` (기본값)
- Output Directory: `.next` (기본값)

### 4. 배포

- `main` 브랜치에 푸시하면 자동으로 프로덕션 배포
- `staging` 브랜치에 푸시하면 스테이징 배포

## Google OAuth 설정

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. OAuth 2.0 클라이언트 ID 생성
3. Authorized redirect URIs에 추가:
   - 프로덕션: `https://your-project.supabase.co/auth/v1/callback`
   - Vercel 도메인: `https://your-vercel-app.vercel.app/auth/callback`

### 2. Supabase 설정

1. Supabase Dashboard > Authentication > Providers
2. Google provider 활성화
3. Client ID와 Client Secret 입력

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성 및 환경 변수 설정

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저에서 확인

http://localhost:3000 접속

## 문제 해결

### 빌드 실패

1. TypeScript 오류 확인: `npm run build` 실행
2. 환경 변수 확인: Vercel Dashboard에서 확인
3. 의존성 확인: `package.json` 확인

### 데이터베이스 오류

1. Supabase SQL Editor에서 스키마 확인
2. RLS 정책 확인
3. Supabase 캐시 새로고침: `NOTIFY pgrst, 'reload schema';`

### 인증 오류

1. Google OAuth 설정 확인
2. Redirect URLs 확인
3. Supabase Authentication 설정 확인

