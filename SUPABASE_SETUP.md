# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트가 생성되면 Settings > API로 이동합니다.

## 2. 환경 변수 설정

1. `.env.local.example` 파일을 참고하여 `.env.local` 파일을 생성합니다.
2. Supabase 프로젝트의 다음 값들을 복사합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 실제 값으로 업데이트합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 SQL Editor로 이동합니다.
2. `supabase/schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣습니다.
3. Run 버튼을 클릭하여 스키마를 생성합니다.

## 4. Google OAuth 설정

1. Supabase 대시보드에서 Authentication > Providers로 이동합니다.
2. Google provider를 활성화합니다.
3. Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성합니다:
   - [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs에 다음을 추가:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
4. Client ID와 Client Secret을 Supabase에 입력합니다.

## 5. 로컬 개발용 Redirect URL 설정

Google OAuth를 로컬에서 테스트하려면:
1. Google Cloud Console의 Authorized redirect URIs에 다음도 추가:
   ```
   http://localhost:3000/auth/callback
   ```
2. Supabase 대시보드에서 Authentication > URL Configuration으로 이동
3. Redirect URLs에 다음을 추가:
   ```
   http://localhost:3000/auth/callback
   ```

## 파일 구조

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # 클라이언트 컴포넌트용 Supabase 클라이언트
│       ├── server.ts          # 서버 컴포넌트용 Supabase 클라이언트
│       └── middleware.ts      # 미들웨어용 Supabase 클라이언트
├── app/
│   ├── login/
│   │   └── page.tsx          # 로그인 페이지
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # OAuth 콜백 핸들러
│   └── dashboard/
│       └── page.tsx           # 대시보드 페이지
└── components/
    └── Navbar.tsx             # 네비게이션 바 (로그인 상태 표시)

middleware.ts                  # 인증 미들웨어
supabase/
└── schema.sql                # 데이터베이스 스키마
```

## 주요 기능

### 인증
- Google OAuth 로그인
- 자동 세션 관리
- 미들웨어를 통한 인증 보호

### 데이터베이스 테이블
- `teams`: 팀 정보
- `members`: 팀 멤버 정보
- `matches`: 경기 일정
- `match_participants`: 경기 참여자

### 보안
- Row Level Security (RLS) 활성화
- 각 테이블에 대한 접근 권한 정책 설정

## 문제 해결

### 로그인 후 리다이렉트가 작동하지 않는 경우
- Supabase 프로젝트의 Redirect URLs 설정을 확인하세요.
- Google OAuth의 Authorized redirect URIs에 올바른 URL이 추가되었는지 확인하세요.

### 데이터베이스 쿼리 오류가 발생하는 경우
- `supabase/schema.sql`이 올바르게 실행되었는지 확인하세요.
- RLS 정책이 올바르게 설정되었는지 확인하세요.

