# 킥-인 (KIKIN)

풋살 팀 경기 일정을 쉽고 간편하게 관리하는 웹 애플리케이션

## 개요

킥-인은 카카오톡 없이도 팀원들과 경기 일정을 공유하고 참여 여부를 확인할 수 있는 플랫폼입니다.

## 주요 기능

- **팀 관리**: 팀 생성, 팀원 초대, 팀 코드로 가입
- **가입 요청 시스템**: 팀장 승인을 통한 팀 가입
- **경기 일정 관리**: 경기 생성, 참여 여부 확인
- **공지사항**: 팀 공지 작성 및 관리
- **알림 시스템**: 가입 요청, 경기 생성 등 알림
- **사용자 프로필**: 이름 설정 및 관리

## 기술 스택

- **프론트엔드**: Next.js 16, React 19, TypeScript
- **스타일링**: Tailwind CSS 4, SCSS
- **백엔드**: Supabase (PostgreSQL, Authentication)
- **배포**: Vercel

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정

### 설치

1. 저장소 클론

```bash
git clone https://github.com/Melonisjy/KIKIN.git
cd futsal
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. 데이터베이스 설정

Supabase SQL Editor에서 다음 파일들을 순서대로 실행:

- `supabase/schema.sql`
- `supabase/add_user_name.sql`
- `supabase/team_notices_schema.sql`
- `supabase/team_requests_schema.sql`
- `supabase/notifications_schema.sql`

5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── api/          # API 라우트
│   ├── auth/         # 인증 콜백
│   ├── locker-room/  # 메인 대시보드
│   ├── login/        # 로그인 페이지
│   ├── match/        # 경기 관련 페이지
│   ├── notifications/# 알림 페이지
│   └── team/         # 팀 관련 페이지
├── components/       # React 컴포넌트
│   ├── ui/           # UI 컴포넌트
│   └── ...
├── lib/              # 유틸리티 함수
│   └── supabase/     # Supabase 클라이언트
└── styles/           # 스타일 파일

supabase/             # 데이터베이스 스키마 및 SQL
docs/                 # 문서
```

## 브랜치 전략

- `main`: 실서비스 배포용
- `staging`: 실서비스 테스트용
- `dev`: 개발용 (개발용 로그인 포함)

## 배포

Vercel을 통해 자동 배포됩니다. `main` 브랜치에 푸시하면 프로덕션 배포가 진행됩니다.

자세한 배포 가이드는 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)를 참조하세요.

## 문서

- [API 문서](./docs/API.md)
- [컴포넌트 가이드](./docs/COMPONENTS.md)
- [배포 가이드](./docs/DEPLOYMENT.md)

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
