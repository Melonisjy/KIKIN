# Redirect URI Mismatch 에러 해결

## 🔴 문제

`redirect_uri_mismatch` 에러는 Google Cloud Console에 추가한 Redirect URI와 실제 OAuth 요청에서 사용하는 URI가 일치하지 않아서 발생합니다.

## ✅ 올바른 설정 방법

### OAuth 플로우 이해

1. 사용자가 "Google로 로그인" 클릭
2. **Supabase가 Google OAuth 요청 생성** (Supabase의 callback URL 사용)
3. Google이 **Supabase의 callback URL**로 리다이렉트
4. Supabase가 처리 후 **우리 앱의 `/auth/callback`**으로 리다이렉트

### Google Cloud Console 설정

**Google Cloud Console**에는 **Supabase의 callback URL**을 추가해야 합니다:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

⚠️ **`http://localhost:3000/auth/callback`는 추가하지 마세요!**

### Supabase 설정

**Supabase Dashboard** > **Authentication** > **URL Configuration**에는:

```
http://localhost:3000/auth/callback
```

이것을 추가해야 합니다.

## 🔧 해결 단계

### 1단계: Supabase 프로젝트 참조 확인

1. Supabase Dashboard 접속
2. Settings > API
3. Project URL 확인:
   ```
   https://abcdefghijklmnop.supabase.co
                    ↑
              이것이 Project Ref
   ```

### 2단계: Google Cloud Console 수정

1. Google Cloud Console 접속
2. APIs & Services > Credentials
3. 생성한 OAuth 클라이언트 클릭 (또는 편집)
4. **Authorized redirect URIs** 섹션에서:
   - ❌ `http://localhost:3000/auth/callback` 삭제
   - ❌ `http://localhost:3000` 삭제
   - ✅ 다음 URL만 추가:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     예시:
     ```
     https://abcdefghijklmnop.supabase.co/auth/v1/callback
     ```
5. **SAVE** 클릭

### 3단계: Supabase URL Configuration 확인

1. Supabase Dashboard > Authentication > URL Configuration
2. **Redirect URLs**에 다음이 있는지 확인:
   ```
   http://localhost:3000/auth/callback
   ```
   없으면 추가하고 **Save** 클릭

### 4단계: 테스트

1. 변경사항이 반영될 때까지 **1-2분 대기** (Google 설정 반영 시간)
2. 브라우저 캐시 삭제 (Cmd+Shift+R 또는 Ctrl+Shift+R)
3. 개발 서버 재시작: `npm run dev`
4. `http://localhost:3000/login` 접속
5. "Google로 로그인" 클릭

## 📋 정리

### Google Cloud Console

✅ **추가해야 할 URI:**

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

❌ **추가하면 안 되는 URI:**

```
http://localhost:3000/auth/callback
http://localhost:3000
```

### Supabase Dashboard

✅ **추가해야 할 URI:**

```
http://localhost:3000/auth/callback
```

## 🎯 빠른 체크리스트

- [ ] Google Cloud Console에 Supabase callback URL만 추가 (형식: `https://xxx.supabase.co/auth/v1/callback`)
- [ ] Google Cloud Console에서 localhost URL 제거
- [ ] Supabase URL Configuration에 `http://localhost:3000/auth/callback` 추가
- [ ] 1-2분 대기 (설정 반영 시간)
- [ ] 브라우저 캐시 삭제
- [ ] 개발 서버 재시작

## 💡 왜 이렇게 해야 하나요?

OAuth 플로우에서:

- **Google**은 **Supabase**와 직접 통신합니다
- Google은 Supabase의 callback URL로 리다이렉트합니다
- **Supabase**가 처리 후 **우리 앱**으로 리다이렉트합니다

따라서 Google은 Supabase의 URL만 알아야 하고, 우리 앱의 URL은 Supabase가 알아야 합니다!
