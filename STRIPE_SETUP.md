# Stripe 프리미엄 기능 설정 가이드

## 1. Supabase 데이터베이스 스키마 업데이트

1. Supabase Dashboard > SQL Editor로 이동
2. `supabase/premium_schema.sql` 파일의 내용을 복사하여 실행
3. 이 스키마는 `user_profiles` 테이블을 생성하고 프리미엄 상태를 관리합니다

## 2. Stripe 계정 설정

1. [Stripe Dashboard](https://dashboard.stripe.com) 접속
2. Products > Add product 클릭
3. 제품 정보 입력:
   - Name: "FutsalMate Premium"
   - Description: "무제한 경기 생성"
4. Pricing 설정:
   - Price: 9900 KRW (또는 원하는 가격)
   - Billing period: Monthly (월간 구독)
5. Save 후 생성된 **Price ID** 복사 (예: `price_xxxxx`)

## 3. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 추가:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx  # Stripe Dashboard > Developers > API keys
STRIPE_PUBLIC_KEY=pk_test_xxxxx  # (선택사항, 클라이언트에서 사용 시)
STRIPE_PRICE_ID=price_xxxxx       # 위에서 생성한 Price ID
STRIPE_WEBHOOK_SECRET=whsec_xxxxx # Webhook 설정 후 생성됨
```

### Stripe Secret Key 찾기
1. Stripe Dashboard > Developers > API keys
2. Secret key 복사 (Test mode 또는 Live mode)

### Stripe Price ID 찾기
1. Stripe Dashboard > Products
2. 생성한 제품 클릭
3. Price ID 복사

## 4. Stripe Webhook 설정 (로컬 개발)

### 방법 1: Stripe CLI 사용 (권장)

1. [Stripe CLI 설치](https://stripe.com/docs/stripe-cli)
2. 로그인:
   ```bash
   stripe login
   ```
3. Webhook 리스너 시작:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. 출력된 `whsec_xxxxx` 값을 `.env.local`의 `STRIPE_WEBHOOK_SECRET`에 추가

### 방법 2: Stripe Dashboard에서 설정

1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint 클릭
3. Endpoint URL 입력:
   - 로컬: `https://your-ngrok-url.ngrok.io/api/stripe/webhook` (ngrok 사용)
   - 프로덕션: `https://yourdomain.com/api/stripe/webhook`
4. Events to send 선택:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Signing secret 복사하여 `.env.local`에 추가

## 5. 프로덕션 배포 시

### Vercel 배포 시

1. Vercel Dashboard > Settings > Environment Variables
2. 다음 변수들 추가:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
3. Stripe Dashboard에서 프로덕션 Webhook 엔드포인트 추가

### Webhook 엔드포인트 보안

프로덕션에서는 반드시:
- HTTPS 사용
- Webhook signing secret 확인
- Idempotency 처리 (중복 이벤트 방지)

## 6. 테스트

### Test Mode로 테스트

1. Stripe Dashboard에서 Test mode 활성화
2. Test card 사용:
   - 성공: `4242 4242 4242 4242`
   - 실패: `4000 0000 0000 0002`
   - CVC: 임의의 3자리
   - 만료일: 미래 날짜

### 테스트 플로우

1. `/premium` 페이지 접속
2. "프리미엄으로 업그레이드" 클릭
3. Stripe Checkout에서 테스트 카드로 결제
4. 결제 성공 후 `/premium?success=true`로 리다이렉트
5. 대시보드에서 Premium 뱃지 확인
6. 경기 생성 제한이 해제되었는지 확인

## 7. 문제 해결

### Webhook이 작동하지 않는 경우
- Webhook URL이 올바른지 확인
- Signing secret이 일치하는지 확인
- Stripe Dashboard > Webhooks에서 이벤트 로그 확인

### 결제는 되었지만 프리미엄이 활성화되지 않는 경우
- Webhook이 제대로 설정되었는지 확인
- Supabase `user_profiles` 테이블 확인
- 브라우저 콘솔 및 서버 로그 확인

### 환경 변수가 인식되지 않는 경우
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버 재시작
- 변수명이 정확한지 확인 (대소문자 구분)

