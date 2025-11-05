# Google OAuth 빠른 해결 가이드

## ⚠️ 에러: "provider is not enabled"

이 에러는 Supabase에서 Google OAuth가 활성화되지 않아서 발생합니다.

## 🚀 빠른 해결 방법 (3단계)

### 1️⃣ Google Cloud Console에서 OAuth 클라이언트 생성

1. **Google Cloud Console 접속**: https://console.cloud.google.com/
2. 프로젝트 선택 (없으면 생성)
3. **APIs & Services** > **Credentials** 클릭
4. **+ CREATE CREDENTIALS** > **OAuth client ID** 선택
5. 처음이라면 Consent Screen 설정:
   - User Type: **External** 선택
   - 필수 정보 입력 후 저장
6. OAuth 클라이언트 생성:
   - Application type: **Web application**
   - Name: "FutsalMate" (또는 원하는 이름)
   - **Authorized redirect URIs**에 추가:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     ⚠️ YOUR_PROJECT_REF를 실제 Supabase 프로젝트 참조로 교체
     예: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - **CREATE** 클릭
7. **Client ID**와 **Client Secret** 복사 (필요!)

### 2️⃣ Supabase에서 Google Provider 활성화

1. **Supabase Dashboard**: https://app.supabase.com
2. 프로젝트 선택
3. 좌측 메뉴: **Authentication** > **Providers**
4. **Google** 찾기
5. **Enable Google provider** 토글을 **ON**으로 변경
6. 값 입력:
   - **Client ID (for OAuth)**: Google에서 복사한 Client ID
   - **Client Secret (for OAuth)**: Google에서 복사한 Client Secret
7. **Save** 클릭

### 3️⃣ Redirect URL 설정

1. Supabase: **Authentication** > **URL Configuration**
2. **Redirect URLs**에 추가:
   ```
   http://localhost:3000/auth/callback
   ```
3. **Save** 클릭

## ✅ 확인

1. 개발 서버 재시작: `npm run dev`
2. `http://localhost:3000/login` 접속
3. "Google로 로그인" 클릭
4. Google 로그인 화면이 나타나면 성공!

## 🔍 Supabase 프로젝트 참조 확인 방법

1. Supabase Dashboard 접속
2. Settings > API
3. Project URL에서 확인:
   ```
   https://abcdefghijklmnop.supabase.co
                    ↑
              이것이 Project Ref
   ```

## ⚡ 빠른 체크리스트

- [ ] Google Cloud Console에서 OAuth 클라이언트 생성 완료
- [ ] Authorized redirect URI에 Supabase callback URL 추가
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID와 Secret 입력 완료
- [ ] Redirect URLs에 localhost 추가
- [ ] 개발 서버 재시작

## 🆘 여전히 안 되는 경우

1. **브라우저 캐시 삭제** 후 재시도
2. **Supabase 프로젝트가 완전히 설정될 때까지 기다리기** (몇 분)
3. **에러 메시지 확인**: 브라우저 콘솔(F12)에서 자세한 에러 확인
4. **Google Cloud Console 확인**: OAuth 클라이언트가 올바르게 생성되었는지 확인

