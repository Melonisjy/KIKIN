# Supabase 빠른 시작 가이드

## 1. Supabase 프로젝트 생성하기

### Step 1: Supabase 가입/로그인
1. [Supabase 웹사이트](https://supabase.com) 접속
2. "Start your project" 또는 "Sign in" 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 가입)

### Step 2: 새 프로젝트 생성
1. 대시보드에서 **"New Project"** 버튼 클릭
2. 프로젝트 정보 입력:
   - **Name**: 프로젝트 이름 (예: `futsal-mate`)
   - **Database Password**: 강력한 비밀번호 설정 (꼭 저장해두세요!)
   - **Region**: 가장 가까운 지역 선택 (예: `Northeast Asia (Seoul)`)
   - **Pricing Plan**: Free tier 선택
3. **"Create new project"** 클릭
4. 프로젝트 생성 대기 (약 2분 정도 소요)

## 2. Supabase URL과 API Key 찾기

### Step 1: API 설정 페이지로 이동
1. 프로젝트 대시보드에서 좌측 메뉴 클릭
2. **Settings** (⚙️ 아이콘) 클릭
3. **API** 메뉴 클릭

### Step 2: 필요한 값 복사
다음 두 가지 값을 찾을 수 있습니다:

#### 1. Project URL (NEXT_PUBLIC_SUPABASE_URL)
- 위치: "Project URL" 섹션
- 형식: `https://xxxxxxxxxxxxx.supabase.co`
- 예시: `https://abcdefghijklmnop.supabase.co`

#### 2. anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- 위치: "Project API keys" 섹션의 **"anon" "public"** 키
- 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)
- ⚠️ **"anon" "public"** 키를 사용하세요 (secret key가 아닙니다!)

## 3. .env.local 파일에 입력하기

프로젝트 루트에 `.env.local` 파일을 생성하고 다음처럼 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### 실제 예시:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

## 4. 확인 방법

`.env.local` 파일을 저장한 후:
1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 에러가 없으면 성공!

## 주의사항

- ✅ `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- ✅ `anon/public` 키만 사용하세요 (secret key는 서버 사이드에서만 사용)
- ✅ URL에는 `https://`가 포함되어야 합니다
- ✅ 값 사이에 공백이나 따옴표가 없어야 합니다

