# Google OAuth 설정 가이드

## 문제: "provider is not enabled" 에러

이 에러는 Supabase에서 Google OAuth 제공자가 활성화되지 않아서 발생합니다.

## 해결 방법

### 1단계: Google Cloud Console에서 OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. 좌측 메뉴에서 **APIs & Services** > **Credentials** 클릭
4. 상단의 **+ CREATE CREDENTIALS** 클릭
5. **OAuth client ID** 선택
6. **Configure consent screen** 클릭 (처음이라면)
   - User Type: **External** 선택
   - 앱 정보 입력 (앱 이름, 사용자 지원 이메일 등)
   - **SAVE AND CONTINUE** 클릭
   - Scopes는 기본값으로 진행
   - Test users 추가 (선택사항)
   - **SAVE AND CONTINUE** 클릭
7. OAuth 클라이언트 생성:
   - Application type: **Web application** 선택
   - Name: 원하는 이름 입력 (예: "FutsalMate")
   - **Authorized redirect URIs** 섹션에 다음 URL 추가:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     예시:
     ```
     https://abcdefghijklmnop.supabase.co/auth/v1/callback
     ```
   - **CREATE** 클릭
8. **Client ID**와 **Client Secret** 복사 (나중에 필요)

### 2단계: Supabase에서 Google Provider 활성화

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Providers** 탭 클릭
5. **Google** 찾아서 클릭
6. **Enable Google provider** 토글을 **ON**으로 변경
7. Google Cloud Console에서 복사한 값 입력:
   - **Client ID (for OAuth)**: Google OAuth Client ID 붙여넣기
   - **Client Secret (for OAuth)**: Google OAuth Client Secret 붙여넣기
8. **Save** 클릭

### 3단계: Redirect URLs 설정

1. Supabase 대시보드에서 **Authentication** > **URL Configuration** 클릭
2. **Redirect URLs** 섹션에 다음 URL 추가:
   ```
   http://localhost:3000/auth/callback
   ```
   (프로덕션 환경이라면 실제 도메인도 추가)
3. **Save** 클릭

### 4단계: 로컬 개발용 추가 설정 (선택사항)

Google Cloud Console에서:
1. **APIs & Services** > **Credentials** > 생성한 OAuth 클라이언트 클릭
2. **Authorized redirect URIs**에 다음도 추가:
   ```
   http://localhost:3000/auth/callback
   ```
3. **SAVE** 클릭

## 확인 방법

1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 `http://localhost:3000/login` 접속
3. "Google로 로그인" 버튼 클릭
4. Google 로그인 화면이 나타나면 성공!

## 문제 해결

### 여전히 "provider is not enabled" 에러가 발생하는 경우:
- Supabase 대시보드에서 Google provider가 정말 활성화되었는지 확인
- 브라우저 캐시 삭제 후 다시 시도
- Supabase 프로젝트가 완전히 설정될 때까지 기다리기 (몇 분 소요될 수 있음)

### Google 로그인 후 리다이렉트가 안 되는 경우:
- Redirect URLs에 올바른 URL이 추가되었는지 확인
- Google Cloud Console의 Authorized redirect URIs도 확인
- 브라우저 콘솔에서 에러 메시지 확인

### "Redirect URI mismatch" 에러가 발생하는 경우:
- Google Cloud Console의 Authorized redirect URIs와 Supabase의 Redirect URLs가 정확히 일치하는지 확인
- URL 끝에 슬래시(/)가 있는지 확인 (일치해야 함)

