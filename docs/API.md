# API 문서

## 개요

킥-인 프로젝트는 Supabase를 백엔드로 사용하는 Next.js 애플리케이션입니다. 대부분의 데이터베이스 작업은 Supabase Client를 통해 직접 수행되며, 일부 서버 사이드 작업은 Next.js API Routes를 통해 처리됩니다.

## 인증

### Supabase Auth
- Google OAuth 로그인
- 이메일/비밀번호 로그인 (개발 환경)
- 세션은 Supabase가 자동으로 관리

## 데이터베이스 테이블

### teams
팀 정보를 저장하는 테이블

**컬럼:**
- `id` (UUID): 팀 고유 ID
- `name` (VARCHAR): 팀 이름
- `description` (TEXT): 팀 설명
- `created_by` (UUID): 생성자 ID
- `created_at` (TIMESTAMP): 생성일시

### members
팀원 정보를 저장하는 테이블

**컬럼:**
- `id` (UUID): 멤버십 고유 ID
- `user_id` (UUID): 사용자 ID
- `team_id` (UUID): 팀 ID
- `role` (VARCHAR): 역할 ('leader' 또는 'member')
- `joined_at` (TIMESTAMP): 가입일시

### matches
경기 일정을 저장하는 테이블

**컬럼:**
- `id` (UUID): 경기 고유 ID
- `team_id` (UUID): 팀 ID
- `date` (DATE): 경기 날짜
- `time` (TIME): 경기 시간
- `location` (VARCHAR): 경기 장소
- `note` (TEXT): 메모
- `status` (VARCHAR): 상태 ('upcoming', 'confirmed', 'cancelled')
- `created_at` (TIMESTAMP): 생성일시
- `updated_at` (TIMESTAMP): 수정일시

### match_participants
경기 참여자 정보를 저장하는 테이블

**컬럼:**
- `id` (UUID): 참여 고유 ID
- `match_id` (UUID): 경기 ID
- `user_id` (UUID): 사용자 ID
- `status` (VARCHAR): 참여 상태 ('going', 'not_going', 'maybe')
- `created_at` (TIMESTAMP): 생성일시
- `updated_at` (TIMESTAMP): 수정일시

### team_requests
팀 가입 요청을 저장하는 테이블

**컬럼:**
- `id` (UUID): 요청 고유 ID
- `user_id` (UUID): 요청자 ID
- `team_id` (UUID): 팀 ID
- `status` (VARCHAR): 상태 ('pending', 'approved', 'rejected')
- `created_at` (TIMESTAMP): 생성일시
- `updated_at` (TIMESTAMP): 수정일시

### team_notices
팀 공지사항을 저장하는 테이블

**컬럼:**
- `id` (UUID): 공지 고유 ID
- `team_id` (UUID): 팀 ID
- `created_by` (UUID): 작성자 ID
- `title` (VARCHAR): 제목
- `content` (TEXT): 내용
- `is_pinned` (BOOLEAN): 고정 여부
- `created_at` (TIMESTAMP): 생성일시
- `updated_at` (TIMESTAMP): 수정일시

### notifications
사용자 알림을 저장하는 테이블

**컬럼:**
- `id` (UUID): 알림 고유 ID
- `user_id` (UUID): 사용자 ID
- `type` (VARCHAR): 알림 타입
- `title` (VARCHAR): 제목
- `message` (TEXT): 메시지
- `related_id` (UUID): 관련 ID (팀 ID, 경기 ID 등)
- `is_read` (BOOLEAN): 읽음 여부
- `created_at` (TIMESTAMP): 생성일시

### user_profiles
사용자 프로필 정보를 저장하는 테이블

**컬럼:**
- `id` (UUID): 사용자 ID (auth.users 참조)
- `name` (VARCHAR): 사용자 이름
- `is_premium` (BOOLEAN): 프리미엄 여부
- `premium_since` (TIMESTAMP): 프리미엄 가입일
- `stripe_customer_id` (VARCHAR): Stripe 고객 ID
- `created_at` (TIMESTAMP): 생성일시
- `updated_at` (TIMESTAMP): 수정일시

## API Routes

### GET /api/profile/get-name
사용자 이름 조회

**응답:**
```json
{
  "name": "사용자 이름" | null
}
```

### POST /api/profile/update-name
사용자 이름 업데이트

**요청 본문:**
```json
{
  "name": "새로운 이름"
}
```

**응답:**
```json
{
  "success": true | false,
  "error": "에러 메시지" (선택)
}
```

## Supabase RPC 함수

### create_notification
알림을 생성하는 함수

**파라미터:**
- `p_user_id` (UUID): 알림을 받을 사용자 ID
- `p_type` (VARCHAR): 알림 타입
- `p_title` (VARCHAR): 제목
- `p_message` (TEXT): 메시지
- `p_related_id` (UUID, 선택): 관련 ID

**반환값:**
- 알림 ID (UUID)

## 에러 처리

모든 Supabase 쿼리는 `src/lib/api-client.ts`의 `executeQuery` 함수를 통해 처리되며, 에러는 자동으로 사용자 친화적 메시지로 변환됩니다.

에러 타입:
- `NETWORK`: 네트워크 연결 오류
- `AUTH`: 인증 오류
- `PERMISSION`: 권한 오류
- `VALIDATION`: 유효성 검사 오류
- `NOT_FOUND`: 데이터를 찾을 수 없음
- `UNKNOWN`: 알 수 없는 오류

